// lib/errors/customErrors.ts - Classes de erro customizadas

import { Request, Response, NextFunction } from 'express';

// Classe base para erros do Syndicate
export class SyndicateError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'SyndicateError';
    
    // Capturar stack trace
    Error.captureStackTrace(this, this.constructor);
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: new Date().toISOString()
    };
  }
}

// Erros específicos por categoria
export class ValidationError extends SyndicateError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends SyndicateError {
  constructor(message: string = 'Autenticação falhou') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends SyndicateError {
  constructor(message: string = 'Acesso não autorizado') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends SyndicateError {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} com identificador '${identifier}' não encontrado`
      : `${resource} não encontrado`;
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends SyndicateError {
  constructor(message: string, originalError?: any) {
    super(
      message, 
      'DATABASE_ERROR', 
      500, 
      { originalError: originalError?.message || originalError }
    );
    this.name = 'DatabaseError';
  }
}

export class GitOperationError extends SyndicateError {
  constructor(operation: string, details?: any) {
    super(
      `Operação Git falhou: ${operation}`,
      'GIT_OPERATION_ERROR',
      500,
      details
    );
    this.name = 'GitOperationError';
  }
}

export class OrchestrationError extends SyndicateError {
  constructor(message: string, stage?: string, details?: any) {
    super(
      message,
      'ORCHESTRATION_ERROR',
      500,
      { stage, ...details }
    );
    this.name = 'OrchestrationError';
  }
}

export class ExternalServiceError extends SyndicateError {
  constructor(service: string, message: string, details?: any) {
    super(
      `Erro no serviço externo '${service}': ${message}`,
      'EXTERNAL_SERVICE_ERROR',
      502,
      details
    );
    this.name = 'ExternalServiceError';
  }
}

export class RateLimitError extends SyndicateError {
  constructor(retryAfter?: number) {
    super(
      'Limite de requisições excedido',
      'RATE_LIMIT_EXCEEDED',
      429,
      { retryAfter }
    );
    this.name = 'RateLimitError';
  }
}

export class ConfigurationError extends SyndicateError {
  constructor(configKey: string) {
    super(
      `Configuração ausente ou inválida: ${configKey}`,
      'CONFIGURATION_ERROR',
      500
    );
    this.name = 'ConfigurationError';
    this.isOperational = false; // Erro não operacional - sistema mal configurado
  }
}

// Middleware de tratamento de erros para Express
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log do erro
  console.error('❌ Erro capturado:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // Se for um erro do Syndicate
  if (err instanceof SyndicateError) {
    const response: any = {
      error: err.message,
      code: err.code,
      timestamp: new Date().toISOString()
    };
    
    // Em desenvolvimento, incluir mais detalhes
    if (process.env.NODE_ENV === 'development') {
      response.details = err.details;
      response.stack = err.stack;
    }
    
    res.status(err.statusCode).json(response);
    return;
  }
  
  // Erros de validação do Joi
  if (err.name === 'ValidationError' && 'isJoi' in err) {
    res.status(400).json({
      error: 'Dados inválidos',
      code: 'VALIDATION_ERROR',
      details: (err as any).details?.map((d: any) => ({
        field: d.path.join('.'),
        message: d.message
      }))
    });
    return;
  }
  
  // Erros de sintaxe JSON
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: 'JSON inválido no corpo da requisição',
      code: 'INVALID_JSON'
    });
    return;
  }
  
  // Erro genérico
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(500).json({
    error: isDevelopment ? err.message : 'Erro interno do servidor',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: err.stack })
  });
}

// Helper para capturar erros assíncronos
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Helper para validar configurações na inicialização
export function validateRequiredEnvVars(vars: string[]): void {
  const missing = vars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    throw new ConfigurationError(
      `Variáveis de ambiente obrigatórias não definidas: ${missing.join(', ')}`
    );
  }
}