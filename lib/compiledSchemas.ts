/**
 * Syndicate v3.0 - Compiled Schemas
 * AUTO-GENERATED FILE — DO NOT EDIT MANUALLY
 * 
 * Schemas compilados do analysis_schemas.yaml para uso com Ajv
 * Mantém compatibilidade com v2.0 e adiciona melhorias v3.0
 */


// Exporta os schemas originais da v2.0 mantendo compatibilidade
export const schemas = {
  // L Lawliet - Strategic Analysis Schema
  "strategic_analysis_schema": {
    "type": "object",
    "required": [
      "hypothesis_id",
      "confidence_score",
      "evidence_support",
      "logical_chain"
    ],
    "properties": {
      "hypothesis_id": {
        "type": "string",
        "pattern": "^H-[0-9]+\\.v[0-9]+$",
        "description": "Format: H-01.v1, H-02.v3, etc."
      },
      "hypothesis_statement": {
        "type": "string",
        "minLength": 10,
        "maxLength": 500,
        "description": "Clear, testable hypothesis statement"
      },
      "confidence_score": {
        "type": "integer",
        "minimum": 0,
        "maximum": 100,
        "description": "L's exact probabilistic assessment"
      },
      "probability_breakdown": {
        "type": "object",
        "properties": {
          "supporting_factors": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "factor": {
                  "type": "string"
                },
                "weight": {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 100
                }
              }
            }
          },
          "contradicting_factors": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "factor": {
                  "type": "string"
                },
                "impact": {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 100
                }
              }
            }
          }
        }
      },
      "evidence_support": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "evidence_id": {
              "type": "string"
            },
            "support_strength": {
              "type": "integer",
              "minimum": 0,
              "maximum": 100
            },
            "relevance": {
              "type": "string",
              "enum": [
                "direct",
                "circumstantial",
                "correlational"
              ]
            }
          }
        }
      },
      "logical_chain": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "step": {
              "type": "integer"
            },
            "premise": {
              "type": "string"
            },
            "inference": {
              "type": "string"
            },
            "confidence": {
              "type": "integer",
              "minimum": 0,
              "maximum": 100
            }
          }
        }
      },
      "alternative_hypotheses": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "alternative": {
              "type": "string"
            },
            "probability": {
              "type": "integer",
              "minimum": 0,
              "maximum": 100
            },
            "key_differences": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          }
        }
      },
      "meta_analysis": {
        "type": "object",
        "properties": {
          "bias_check_score": {
            "type": "integer",
            "minimum": 0,
            "maximum": 100
          },
          "assumption_validation": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "uncertainty_factors": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "validation_triggers": {
        "type": "object",
        "properties": {
          "cross_validation_required": {
            "type": "boolean"
          },
          "devil_advocate_needed": {
            "type": "boolean"
          },
          "specialist_input_required": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "l_characteristics": {
        "type": "object",
        "properties": {
          "sweet_consumption": {
            "type": "string"
          },
          "sitting_position": {
            "type": "string",
            "enum": [
              "characteristic_crouch",
              "standard",
              "thinking_pose"
            ]
          },
          "analytical_mood": {
            "type": "string",
            "enum": [
              "focused",
              "puzzled",
              "breakthrough",
              "concerned"
            ]
          }
        }
      }
    }
  },

  // Senku - Forensic Analysis Schema
  "forensic_analysis_schema": {
    "type": "object",
    "required": [
      "evidence_id",
      "scientific_method",
      "confidence_categories",
      "correlation_data"
    ],
    "properties": {
      "evidence_id": {
        "type": "string",
        "pattern": "^DOC-[0-9]+$",
        "description": "Format: DOC-001, DOC-015, etc."
      },
      "scientific_title": {
        "type": "string",
        "minLength": 5,
        "maxLength": 200,
        "description": "Descriptive scientific title"
      },
      "analysis_methodology": {
        "type": "object",
        "properties": {
          "primary_method": {
            "type": "string"
          },
          "secondary_methods": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "equipment_used": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "scientific_principles": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "scientific_method": {
        "type": "string",
        "description": "Main scientific method used"
      },
      "confidence_categories": {
        "type": "object",
        "properties": {
          "alta_90_100": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "finding": {
                  "type": "string"
                },
                "verification_method": {
                  "type": "string"
                },
                "certainty_phrase": {
                  "type": "string",
                  "default": "10 bilhões por cento verificado!"
                }
              }
            }
          },
          "media_60_89": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "finding": {
                  "type": "string"
                },
                "probability": {
                  "type": "integer",
                  "minimum": 60,
                  "maximum": 89
                },
                "support_evidence": {
                  "type": "string"
                }
              }
            }
          },
          "baixa_30_59": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "finding": {
                  "type": "string"
                },
                "probability": {
                  "type": "integer",
                  "minimum": 30,
                  "maximum": 59
                },
                "additional_testing_needed": {
                  "type": "string"
                }
              }
            }
          },
          "especulativa_0_29": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "theory": {
                  "type": "string"
                },
                "experiment_required": {
                  "type": "string"
                },
                "validation_method": {
                  "type": "string"
                }
              }
            }
          }
        }
      },
      "correlation_data": {
        "type": "object",
        "properties": {
          "internal_correlations": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "correlation_type": {
                  "type": "string"
                },
                "strength": {
                  "type": "number",
                  "minimum": -1.0,
                  "maximum": 1.0
                },
                "significance": {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 100
                }
              }
            }
          },
          "external_correlations": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "related_evidence": {
                  "type": "string"
                },
                "correlation_strength": {
                  "type": "string",
                  "enum": [
                    "strong",
                    "moderate",
                    "weak"
                  ]
                },
                "scientific_basis": {
                  "type": "string"
                }
              }
            }
          }
        }
      },
      "timeline_analysis": {
        "type": "object",
        "properties": {
          "estimated_origin": {
            "type": "string"
          },
          "degradation_pattern": {
            "type": "string"
          },
          "temporal_markers": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "senku_characteristics": {
        "type": "object",
        "properties": {
          "enthusiasm_level": {
            "type": "string",
            "enum": [
              "10_billion_percent",
              "highly_excited",
              "scientifically_focused"
            ]
          },
          "glasses_adjustment": {
            "type": "boolean"
          },
          "scientific_breakthrough": {
            "type": "boolean"
          }
        }
      },
      "quality_metrics": {
        "type": "object",
        "properties": {
          "methodology_soundness": {
            "type": "integer",
            "minimum": 0,
            "maximum": 100
          },
          "reproducibility_score": {
            "type": "integer",
            "minimum": 0,
            "maximum": 100
          },
          "peer_review_ready": {
            "type": "boolean"
          }
        }
      }
    }
  },

  // Norman - Psychological Analysis Schema
  "psychological_analysis_schema": {
    "type": "object",
    "required": [
      "subject_name",
      "behavioral_baseline",
      "psychological_profile",
      "prediction_matrix"
    ],
    "properties": {
      "subject_name": {
        "type": "string",
        "minLength": 1,
        "maxLength": 100
      },
      "threat_level": {
        "type": "string",
        "enum": [
          "MINIMO",
          "BAIXO",
          "MEDIO",
          "ALTO",
          "CRITICO"
        ],
        "description": "Threat assessment classification"
      },
      "behavioral_baseline": {
        "type": "object",
        "properties": {
          "normal_patterns": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "behavior": {
                  "type": "string"
                },
                "frequency": {
                  "type": "string"
                },
                "context": {
                  "type": "string"
                },
                "reliability": {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 100
                }
              }
            }
          },
          "deviation_indicators": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "deviation": {
                  "type": "string"
                },
                "significance": {
                  "type": "string",
                  "enum": [
                    "critical",
                    "moderate",
                    "minor"
                  ]
                },
                "psychological_meaning": {
                  "type": "string"
                }
              }
            }
          }
        }
      },
      "psychological_profile": {
        "type": "object",
        "properties": {
          "core_motivations": {
            "type": "object",
            "properties": {
              "primary_desire": {
                "type": "string"
              },
              "primary_fear": {
                "type": "string"
              },
              "value_system": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              }
            }
          },
          "defense_mechanisms": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "mechanism": {
                  "type": "string"
                },
                "trigger": {
                  "type": "string"
                },
                "effectiveness": {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 100
                }
              }
            }
          },
          "vulnerability_assessment": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "vulnerability": {
                  "type": "string"
                },
                "exploitation_method": {
                  "type": "string"
                },
                "ethical_considerations": {
                  "type": "string"
                }
              }
            }
          }
        }
      },
      "microexpression_analysis": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "emotion": {
              "type": "string"
            },
            "expression": {
              "type": "string"
            },
            "duration_ms": {
              "type": "integer"
            },
            "context": {
              "type": "string"
            },
            "interpretation": {
              "type": "string"
            },
            "confidence": {
              "type": "integer",
              "minimum": 0,
              "maximum": 100
            }
          }
        }
      },
      "prediction_matrix": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "scenario": {
              "type": "string"
            },
            "trigger": {
              "type": "string"
            },
            "predicted_response": {
              "type": "string"
            },
            "probability": {
              "type": "integer",
              "minimum": 0,
              "maximum": 100
            },
            "behavioral_indicators": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "timeline": {
              "type": "string"
            }
          }
        }
      },
      "interaction_strategy": {
        "type": "object",
        "properties": {
          "optimal_approach": {
            "type": "string"
          },
          "approaches_to_avoid": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "pressure_points": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "cooperation_likelihood": {
            "type": "integer",
            "minimum": 0,
            "maximum": 100
          }
        }
      },
      "norman_characteristics": {
        "type": "object",
        "properties": {
          "smile_type": {
            "type": "string",
            "enum": [
              "calculated",
              "gentle",
              "knowing",
              "serious"
            ]
          },
          "analytical_intensity": {
            "type": "string",
            "enum": [
              "focused",
              "penetrating",
              "empathetic"
            ]
          },
          "ethical_concern_level": {
            "type": "integer",
            "minimum": 0,
            "maximum": 100
          }
        }
      },
      "genealogical_context": {
        "type": "object",
        "properties": {
          "family_patterns": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "inherited_traits": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "generational_trauma": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      }
    }
  },

  // Isagi - Tactical Analysis Schema
  "tactical_analysis_schema": {
    "type": "object",
    "required": [
      "field_state",
      "optimization_matrix",
      "strategic_recommendations",
      "resource_analysis"
    ],
    "properties": {
      "field_state": {
        "type": "object",
        "properties": {
          "controlled_zones": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "zone_id": {
                  "type": "string"
                },
                "control_percentage": {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 100
                },
                "strategic_value": {
                  "type": "integer",
                  "minimum": 1,
                  "maximum": 10
                }
              }
            }
          },
          "contested_zones": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "zone_id": {
                  "type": "string"
                },
                "contest_level": {
                  "type": "string",
                  "enum": [
                    "high",
                    "medium",
                    "low"
                  ]
                },
                "competitors": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              }
            }
          },
          "flow_patterns": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "from_zone": {
                  "type": "string"
                },
                "to_zone": {
                  "type": "string"
                },
                "flow_rate": {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 100
                }
              }
            }
          }
        }
      },
      "optimization_matrix": {
        "type": "object",
        "properties": {
          "current_efficiency": {
            "type": "integer",
            "minimum": 0,
            "maximum": 100
          },
          "optimal_efficiency": {
            "type": "integer",
            "minimum": 0,
            "maximum": 100
          },
          "optimization_variables": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "variable": {
                  "type": "string"
                },
                "current_value": {
                  "type": "number"
                },
                "optimal_value": {
                  "type": "number"
                },
                "adjustment_required": {
                  "type": "string"
                }
              }
            }
          }
        }
      },
      "strategic_recommendations": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "recommendation": {
              "type": "string"
            },
            "priority": {
              "type": "string",
              "enum": [
                "critical",
                "high",
                "medium",
                "low"
              ]
            },
            "expected_impact": {
              "type": "integer",
              "minimum": 0,
              "maximum": 100
            },
            "implementation_timeline": {
              "type": "string"
            }
          }
        }
      },
      "resource_analysis": {
        "type": "object",
        "properties": {
          "available_resources": {
            "type": "object",
            "additionalProperties": {
              "type": "integer"
            }
          },
          "required_resources": {
            "type": "object",
            "additionalProperties": {
              "type": "integer"
            }
          },
          "resource_gap": {
            "type": "object",
            "additionalProperties": {
              "type": "integer"
            }
          }
        }
      },
      "game_theory_analysis": {
        "type": "object",
        "properties": {
          "players": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "strategies": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "player": {
                  "type": "string"
                },
                "strategy": {
                  "type": "string"
                },
                "payoff": {
                  "type": "number"
                }
              }
            }
          },
          "nash_equilibrium": {
            "type": "string"
          }
        }
      },
      "isagi_characteristics": {
        "type": "object",
        "properties": {
          "field_vision_active": {
            "type": "boolean"
          },
          "ego_level": {
            "type": "string",
            "enum": [
              "flow_state",
              "high_focus",
              "normal",
              "analytical"
            ]
          },
          "weapon_identified": {
            "type": "string"
          }
        }
      }
    }
  },

  // Obi - Coordination Report Schema (v3.0 addition)
  "coordination_report_schema": {
    "type": "object",
    "required": [
      "mission_id",
      "mission_status",
      "team_performance",
      "resource_allocation"
    ],
    "properties": {
      "mission_id": {
        "type": "string",
        "pattern": "^MSN-[0-9]+$",
        "description": "Format: MSN-001, MSN-002, etc."
      },
      "mission_status": {
        "type": "string",
        "enum": [
          "initiated",
          "in_progress",
          "blocked",
          "completed",
          "failed"
        ]
      },
      "team_performance": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "specialist": {
              "type": "string"
            },
            "task": {
              "type": "string"
            },
            "performance_rating": {
              "type": "integer",
              "minimum": 0,
              "maximum": 10
            },
            "collaboration_score": {
              "type": "integer",
              "minimum": 0,
              "maximum": 100
            },
            "notes": {
              "type": "string"
            }
          },
          "required": ["specialist", "task", "performance_rating"]
        }
      },
      "resource_allocation": {
        "type": "object",
        "additionalProperties": true
      },
      "risk_assessment": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "risk": {
              "type": "string"
            },
            "severity": {
              "type": "string",
              "enum": ["low", "medium", "high", "critical"]
            },
            "mitigation": {
              "type": "string"
            },
            "contingency_plan": {
              "type": "string"
            }
          }
        }
      },
      "team_synergy": {
        "type": "object",
        "properties": {
          "overall_synergy": {
            "type": "integer",
            "minimum": 0,
            "maximum": 100
          },
          "conflict_points": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "collaboration_highlights": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "obi_characteristics": {
        "type": "object",
        "properties": {
          "leadership_style": {
            "type": "string",
            "enum": [
              "supportive",
              "directive",
              "delegative",
              "emergency"
            ]
          },
          "team_morale_assessment": {
            "type": "integer",
            "minimum": 0,
            "maximum": 100
          },
          "fire_force_philosophy_applied": {
            "type": "boolean"
          }
        }
      }
    }
  },

  // Shared Schemas - Cross Validation Result
  "cross_validation_result": {
    "type": "object",
    "required": [
      "validation_id",
      "specialists_involved",
      "original_assessment",
      "validation_results"
    ],
    "properties": {
      "validation_id": {
        "type": "string",
        "pattern": "^VAL-[0-9]+$"
      },
      "specialists_involved": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "minItems": 2
      },
      "original_assessment": {
        "type": "object",
        "properties": {
          "specialist": {
            "type": "string"
          },
          "conclusion": {
            "type": "string"
          },
          "confidence": {
            "type": "integer",
            "minimum": 0,
            "maximum": 100
          }
        },
        "required": ["specialist", "conclusion", "confidence"]
      },
      "validation_results": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "validator": {
              "type": "string"
            },
            "agreement_level": {
              "type": "integer",
              "minimum": 0,
              "maximum": 100
            },
            "concerns": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "supporting_evidence": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          },
          "required": ["validator", "agreement_level"]
        }
      },
      "final_consensus": {
        "type": "object",
        "properties": {
          "conclusion": {
            "type": "string"
          },
          "confidence": {
            "type": "integer",
            "minimum": 0,
            "maximum": 100
          },
          "dissenting_opinions": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      }
    }
  },

  // Timeline Entry Schema
  "entrada_timeline": {
    "type": "object",
    "required": [
      "entry_id",
      "event_type",
      "description",
      "date_time"
    ],
    "properties": {
      "entry_id": {
        "type": "string",
        "pattern": "^TML-[0-9]+$"
      },
      "event_type": {
        "type": "string"
      },
      "description": {
        "type": "string",
        "minLength": 10
      },
      "date_time": {
        "type": "string",
        "format": "date-time"
      },
      "location": {
        "type": "string"
      },
      "participants": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "related_evidence": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "significance_level": {
        "type": "string",
        "enum": ["low", "medium", "high", "critical"]
      },
      "author": {
        "type": "string"
      },
      "timestamp": {
        "type": "string",
        "format": "date-time"
      }
    }
  },

  // Miscellaneous Record Schema
  "registro_misc": {
    "type": "object",
    "required": [
      "record_id",
      "category",
      "title",
      "content"
    ],
    "properties": {
      "record_id": {
        "type": "string",
        "pattern": "^MISC-[0-9]+$"
      },
      "category": {
        "type": "string"
      },
      "title": {
        "type": "string",
        "minLength": 3
      },
      "content": {
        "type": "string",
        "minLength": 10
      },
      "tags": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "related_records": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "metadata": {
        "type": "object",
        "additionalProperties": true
      },
      "author": {
        "type": "string"
      },
      "timestamp": {
        "type": "string",
        "format": "date-time"
      }
    }
  },

  // Vault Record Schema (used by runtimeOrchestrator)
  "vault_record_schema": {
    "type": "object",
    "required": ["contexto", "autor", "timestamp"],
    "properties": {
      "contexto": {
        "type": "string"
      },
      "autor": {
        "type": "string"
      },
      "tipo_registro": {
        "type": "string"
      },
      "timestamp": {
        "type": "string"
      },
      "confidence": {
        "type": "number",
        "minimum": 0,
        "maximum": 100
      }
    }
  }
};

// Type guard para verificar se é um schema ID válido
export type SchemaId = keyof typeof schemas;

export function isValidSchemaId(id: string): id is SchemaId {
  return id in schemas;
}

// Type definitions para TypeScript
export interface StrategicAnalysisSchema {
  hypothesis_id: string;
  hypothesis_statement?: string;
  confidence_score: number;
  probability_breakdown?: {
    supporting_factors?: Array<{
      factor: string;
      weight: number;
    }>;
    contradicting_factors?: Array<{
      factor: string;
      impact: number;
    }>;
  };
  evidence_support: Array<{
    evidence_id: string;
    support_strength?: number;
    relevance?: 'direct' | 'circumstantial' | 'correlational';
  }>;
  logical_chain: Array<{
    step?: number;
    premise?: string;
    inference?: string;
    confidence?: number;
  }>;
  alternative_hypotheses?: Array<{
    alternative?: string;
    probability?: number;
    key_differences?: string[];
  }>;
  meta_analysis?: {
    bias_check_score?: number;
    assumption_validation?: string[];
    uncertainty_factors?: string[];
  };
  validation_triggers?: {
    cross_validation_required?: boolean;
    devil_advocate_needed?: boolean;
    specialist_input_required?: string[];
  };
  l_characteristics?: {
    sweet_consumption?: string;
    sitting_position?: 'characteristic_crouch' | 'standard' | 'thinking_pose';
    analytical_mood?: 'focused' | 'puzzled' | 'breakthrough' | 'concerned';
  };
}

export interface ForensicAnalysisSchema {
  evidence_id: string;
  scientific_title?: string;
  analysis_methodology?: {
    primary_method?: string;
    secondary_methods?: string[];
    equipment_used?: string[];
    scientific_principles?: string[];
  };
  scientific_method: string;
  confidence_categories: {
    alta_90_100?: Array<{
      finding?: string;
      verification_method?: string;
      certainty_phrase?: string;
    }>;
    media_60_89?: Array<{
      finding?: string;
      probability?: number;
      support_evidence?: string;
    }>;
    baixa_30_59?: Array<{
      finding?: string;
      probability?: number;
      additional_testing_needed?: string;
    }>;
    especulativa_0_29?: Array<{
      theory?: string;
      experiment_required?: string;
      validation_method?: string;
    }>;
  };
  correlation_data: any;
  timeline_analysis?: {
    estimated_origin?: string;
    degradation_pattern?: string;
    temporal_markers?: string[];
  };
  senku_characteristics?: {
    enthusiasm_level?: '10_billion_percent' | 'highly_excited' | 'scientifically_focused';
    glasses_adjustment?: boolean;
    scientific_breakthrough?: boolean;
  };
  quality_metrics?: {
    methodology_soundness?: number;
    reproducibility_score?: number;
    peer_review_ready?: boolean;
  };
}

export interface PsychologicalAnalysisSchema {
  subject_name: string;
  threat_level?: 'MINIMO' | 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  behavioral_baseline: any;
  psychological_profile: any;
  microexpression_analysis?: Array<{
    emotion?: string;
    expression?: string;
    duration_ms?: number;
    context?: string;
    interpretation?: string;
    confidence?: number;
  }>;
  prediction_matrix: any[];
  interaction_strategy?: {
    optimal_approach?: string;
    approaches_to_avoid?: string[];
    pressure_points?: string[];
    cooperation_likelihood?: number;
  };
  norman_characteristics?: {
    smile_type?: 'calculated' | 'gentle' | 'knowing' | 'serious';
    analytical_intensity?: 'focused' | 'penetrating' | 'empathetic';
    ethical_concern_level?: number;
  };
  genealogical_context?: {
    family_patterns?: string[];
    inherited_traits?: string[];
    generational_trauma?: string[];
  };
}

export interface TacticalAnalysisSchema {
  field_state: any;
  optimization_matrix: any;
  strategic_recommendations: any;
  resource_analysis: any;
  game_theory_analysis?: {
    players?: string[];
    strategies?: Array<{
      player?: string;
      strategy?: string;
      payoff?: number;
    }>;
    nash_equilibrium?: string;
  };
  isagi_characteristics?: {
    field_vision_active?: boolean;
    ego_level?: 'flow_state' | 'high_focus' | 'normal' | 'analytical';
    weapon_identified?: string;
  };
}

export interface CoordinationReportSchema {
  mission_id: string;
  mission_status: 'initiated' | 'in_progress' | 'blocked' | 'completed' | 'failed';
  team_performance: Array<{
    specialist: string;
    task: string;
    performance_rating: number;
    collaboration_score?: number;
    notes?: string;
  }>;
  resource_allocation: Record<string, any>;
  risk_assessment?: Array<{
    risk?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    mitigation?: string;
    contingency_plan?: string;
  }>;
  team_synergy?: {
    overall_synergy?: number;
    conflict_points?: string[];
    collaboration_highlights?: string[];
  };
  obi_characteristics?: {
    leadership_style?: 'supportive' | 'directive' | 'delegative' | 'emergency';
    team_morale_assessment?: number;
    fire_force_philosophy_applied?: boolean;
  };
}

export interface CrossValidationResultSchema {
  validation_id: string;
  specialists_involved: string[];
  original_assessment: {
    specialist: string;
    conclusion: string;
    confidence: number;
  };
  validation_results: Array<{
    validator: string;
    agreement_level: number;
    concerns?: string[];
    supporting_evidence?: string[];
  }>;
  final_consensus?: {
    conclusion?: string;
    confidence?: number;
    dissenting_opinions?: string[];
  };
}

export interface TimelineEntrySchema {
  entry_id: string;
  event_type: string;
  description: string;
  date_time: string;
  location?: string;
  participants?: string[];
  related_evidence?: string[];
  significance_level?: 'low' | 'medium' | 'high' | 'critical';
  author?: string;
  timestamp?: string;
}

export interface MiscRecordSchema {
  record_id: string;
  category: string;
  title: string;
  content: string;
  tags?: string[];
  related_records?: string[];
  metadata?: Record<string, any>;
  author?: string;
  timestamp?: string;
}

// Export dos exemplos da v2.0 (mantidos para compatibilidade)
export const l_output_example = {
  "hypothesis_id": "H-03.v2",
  "hypothesis_statement": "Herbert foi assassinado por envenenamento com substância orgânica",
  "confidence_score": 78,
  "probability_breakdown": {
    "supporting_factors": [
      {
        "factor": "Sintomas compatíveis com envenenamento",
        "weight": 40
      },
      {
        "factor": "Ausência de sinais de violência física",
        "weight": 25
      }
    ],
    "contradicting_factors": [
      {
        "factor": "Idade avançada permite morte natural",
        "impact": 30
      }
    ]
  },
  "evidence_support": [
    {
      "evidence_id": "DOC-15",
      "support_strength": 85,
      "relevance": "direct"
    }
  ],
  "logical_chain": [
    {
      "step": 1,
      "premise": "Sintomas descritos não são típicos de morte natural",
      "inference": "Causa externa provável",
      "confidence": 75
    }
  ],
  "l_characteristics": {
    "sweet_consumption": "mastiga doce pensativo",
    "sitting_position": "characteristic_crouch",
    "analytical_mood": "focused"
  }
};

export const senku_output_example = {
  "evidence_id": "DOC-007",
  "scientific_title": "Análise Química de Tinta em Documento Suspeito",
  "analysis_methodology": {
    "primary_method": "Espectrografia de absorção",
    "secondary_methods": [
      "Cromatografia",
      "Análise de pH"
    ],
    "scientific_principles": [
      "Degradação química temporal",
      "Oxidação de compostos orgânicos"
    ]
  },
  "scientific_method": "Espectrografia de absorção",
  "confidence_categories": {
    "alta_90_100": [
      {
        "finding": "Tinta contém compostos orgânicos do século XIX",
        "verification_method": "Espectrografia comparativa",
        "certainty_phrase": "10 bilhões por cento verificado!"
      }
    ],
    "media_60_89": [
      {
        "finding": "Documento escrito sob stress psicológico",
        "probability": 85,
        "support_evidence": "Pressão irregular da escrita"
      }
    ]
  },
  "correlation_data": {
    "internal_correlations": [],
    "external_correlations": []
  },
  "senku_characteristics": {
    "enthusiasm_level": "10_billion_percent",
    "glasses_adjustment": true,
    "scientific_breakthrough": true
  }
};

export const norman_output_example = {
  "subject_name": "Margaret Ashworth",
  "threat_level": "MEDIO",
  "behavioral_baseline": {
    "normal_patterns": [
      {
        "behavior": "Evita contato visual direto",
        "frequency": "85% das interações",
        "context": "Conversas sobre o passado",
        "reliability": 92
      }
    ],
    "deviation_indicators": [
      {
        "deviation": "Súbita agressividade verbal",
        "significance": "critical",
        "psychological_meaning": "Mecanismo de defesa contra trauma"
      }
    ]
  },
  "psychological_profile": {
    "core_motivations": {
      "primary_desire": "Preservar segredos familiares",
      "primary_fear": "Exposição de vergonha ancestral"
    }
  },
  "prediction_matrix": [
    {
      "scenario": "Confrontada com evidências do passado",
      "trigger": "Menção a eventos familiares específicos",
      "predicted_response": "Negação agressiva seguida de tentativa de mudança de assunto",
      "probability": 87,
      "behavioral_indicators": ["Aumento de tensão muscular", "Fala acelerada"],
      "timeline": "Imediato (0-5 segundos)"
    }
  ],
  "norman_characteristics": {
    "smile_type": "calculated",
    "analytical_intensity": "penetrating",
    "ethical_concern_level": 75
  }
};