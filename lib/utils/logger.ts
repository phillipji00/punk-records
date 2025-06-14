import winston from 'winston';
import path from 'path';

// Definir níveis de log customizados
const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'grey'
  }
};

// Formato customizado para logs
const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  // Adicionar metadata se existir
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Criar logger
const logger = winston.createLogger({
  levels: logLevels.levels,
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'syndicate-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Arquivo de erros - apenas erros
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    // Arquivo combinado - todos os logs
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],
  // Tratamento de exceções não capturadas
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'exceptions.log')
    })
  ],
  // Tratamento de rejeições de promises
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'rejections.log')
    })
  ]
});

// Em desenvolvimento, adicionar console colorido
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.timestamp({
        format: 'HH:mm:ss'
      }),
      customFormat
    )
  }));
}

// Adicionar cores ao winston
winston.addColors(logLevels.colors);

// Criar helpers específicos para diferentes contextos
export const loggers = {
  main: logger,
  
  database: logger.child({ context: 'database' }),
  
  orchestrator: logger.child({ context: 'orchestrator' }),
  
  api: logger.child({ context: 'api' }),
  
  git: logger.child({ context: 'git' }),
  
  trigger: logger.child({ context: 'trigger' })
};

// Criar diretório de logs se não existir
import fs from 'fs';
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Helpers para diferentes níveis
export const log = {
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  http: (message: string, meta?: any) => logger.http(message, meta),
  verbose: (message: string, meta?: any) => logger.verbose(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
  
  // Método especial para tracking de performance
  performance: (operation: string, duration: number, meta?: any) => {
    logger.info(`Performance: ${operation}`, {
      duration_ms: duration,
      ...meta
    });
  },
  
  // Método para auditoria
  audit: (action: string, user: string, details: any) => {
    logger.info(`Audit: ${action}`, {
      user,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }
};

export default logger;
