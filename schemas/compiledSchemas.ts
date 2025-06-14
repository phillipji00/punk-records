/* AUTO-GENERATED FILE — DO NOT EDIT MANUALLY */
export const schemas = {
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
  "l_output_example": {
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
},
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
  "senku_output_example": {
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
  "senku_characteristics": {
    "enthusiasm_level": "10_billion_percent",
    "glasses_adjustment": true,
    "scientific_breakthrough": true
  }
},
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
  "norman_output_example": {
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
  "norman_characteristics": {
    "smile_type": "calculated",
    "analytical_intensity": "penetrating",
    "ethical_concern_level": 75
  }
},
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
                  "moderate",
                  "low"
                ]
              },
              "opportunity_score": {
                "type": "integer",
                "minimum": 1,
                "maximum": 10
              }
            }
          }
        },
        "target_zones": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "zone_id": {
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
              "access_difficulty": {
                "type": "integer",
                "minimum": 1,
                "maximum": 10
              }
            }
          }
        }
      }
    },
    "resource_analysis": {
      "type": "object",
      "properties": {
        "investigation_weapons": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "weapon_id": {
                "type": "string"
              },
              "weapon_type": {
                "type": "string"
              },
              "power_level": {
                "type": "integer",
                "minimum": 1,
                "maximum": 10
              },
              "tactical_usage": {
                "type": "string"
              },
              "synergy_potential": {
                "type": "string",
                "enum": [
                  "high",
                  "medium",
                  "low"
                ]
              }
            }
          }
        },
        "tactical_combinations": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "combo_id": {
                "type": "string"
              },
              "weapons_involved": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "combined_effect": {
                "type": "string"
              },
              "success_probability": {
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
        "optimization_opportunities": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "opportunity": {
                "type": "string"
              },
              "potential_gain": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100
              },
              "implementation_cost": {
                "type": "string",
                "enum": [
                  "low",
                  "medium",
                  "high"
                ]
              }
            }
          }
        },
        "bottlenecks_identified": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "bottleneck": {
                "type": "string"
              },
              "impact_level": {
                "type": "integer",
                "minimum": 1,
                "maximum": 10
              },
              "solution_complexity": {
                "type": "string",
                "enum": [
                  "simple",
                  "moderate",
                  "complex"
                ]
              }
            }
          }
        }
      }
    },
    "strategic_recommendations": {
      "type": "object",
      "properties": {
        "optimal_strategy": {
          "type": "object",
          "properties": {
            "phases": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "phase_number": {
                    "type": "integer"
                  },
                  "action": {
                    "type": "string"
                  },
                  "objective": {
                    "type": "string"
                  },
                  "success_probability": {
                    "type": "integer",
                    "minimum": 0,
                    "maximum": 100
                  },
                  "resource_cost": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "alternative_strategies": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "strategy_name": {
                "type": "string"
              },
              "pros": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "cons": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "success_rate": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100
              }
            }
          }
        }
      }
    },
    "game_theory_analysis": {
      "type": "object",
      "properties": {
        "players_identified": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "rule_discovery": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "optimal_moves": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "counter_strategies": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "isagi_characteristics": {
      "type": "object",
      "properties": {
        "intensity_level": {
          "type": "string",
          "enum": [
            "focused",
            "intense",
            "breakthrough_mode"
          ]
        },
        "field_vision_clarity": {
          "type": "integer",
          "minimum": 0,
          "maximum": 100
        },
        "ego_drive_level": {
          "type": "integer",
          "minimum": 0,
          "maximum": 100
        },
        "devour_mode_active": {
          "type": "boolean"
        }
      }
    }
  }
},
  "isagi_output_example": {
  "field_state": {
    "controlled_zones": [
      {
        "zone_id": "evidence_sector_A",
        "control_percentage": 85,
        "strategic_value": 9
      }
    ],
    "contested_zones": [
      {
        "zone_id": "witness_testimonies",
        "contest_level": "high",
        "opportunity_score": 7
      }
    ]
  },
  "resource_analysis": {
    "investigation_weapons": [
      {
        "weapon_id": "DOC-015",
        "weapon_type": "historical_evidence",
        "power_level": 8,
        "tactical_usage": "timeline_validation",
        "synergy_potential": "high"
      }
    ]
  },
  "optimization_matrix": {
    "current_efficiency": 73,
    "optimization_opportunities": [
      {
        "opportunity": "Parallel evidence processing",
        "potential_gain": 25,
        "implementation_cost": "medium"
      }
    ]
  },
  "isagi_characteristics": {
    "intensity_level": "breakthrough_mode",
    "field_vision_clarity": 95,
    "ego_drive_level": 88,
    "devour_mode_active": true
  }
},
  "coordination_schema": {
  "type": "object",
  "required": [
    "mission_status",
    "team_performance",
    "resource_allocation",
    "risk_assessment"
  ],
  "properties": {
    "mission_status": {
      "type": "object",
      "properties": {
        "current_phase": {
          "type": "string"
        },
        "completion_percentage": {
          "type": "integer",
          "minimum": 0,
          "maximum": 100
        },
        "critical_milestones": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "blockers_identified": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "team_performance": {
      "type": "object",
      "properties": {
        "specialist_metrics": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "specialist_id": {
                "type": "string"
              },
              "performance_score": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100
              },
              "tasks_completed": {
                "type": "integer"
              },
              "quality_rating": {
                "type": "integer",
                "minimum": 1,
                "maximum": 10
              },
              "current_status": {
                "type": "string",
                "enum": [
                  "available",
                  "busy",
                  "blocked",
                  "offline"
                ]
              }
            }
          }
        },
        "collaboration_effectiveness": {
          "type": "object",
          "properties": {
            "cross_validation_success_rate": {
              "type": "integer",
              "minimum": 0,
              "maximum": 100
            },
            "communication_quality": {
              "type": "integer",
              "minimum": 1,
              "maximum": 10
            },
            "conflict_resolution_count": {
              "type": "integer"
            }
          }
        }
      }
    },
    "resource_allocation": {
      "type": "object",
      "properties": {
        "current_resources": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "resource_type": {
                "type": "string"
              },
              "availability": {
                "type": "string",
                "enum": [
                  "abundant",
                  "adequate",
                  "limited",
                  "critical"
                ]
              },
              "utilization_rate": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100
              }
            }
          }
        },
        "optimization_recommendations": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "recommendation": {
                "type": "string"
              },
              "expected_improvement": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100
              },
              "implementation_effort": {
                "type": "string",
                "enum": [
                  "low",
                  "medium",
                  "high"
                ]
              }
            }
          }
        }
      }
    },
    "risk_assessment": {
      "type": "object",
      "properties": {
        "identified_risks": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "risk_id": {
                "type": "string"
              },
              "risk_type": {
                "type": "string"
              },
              "probability": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100
              },
              "impact_level": {
                "type": "string",
                "enum": [
                  "low",
                  "medium",
                  "high",
                  "critical"
                ]
              },
              "mitigation_strategy": {
                "type": "string"
              }
            }
          }
        }
      }
    },
    "obi_characteristics": {
      "type": "object",
      "properties": {
        "leadership_mode": {
          "type": "string",
          "enum": [
            "coordination",
            "crisis_management",
            "motivation",
            "mediation"
          ]
        },
        "team_morale_level": {
          "type": "integer",
          "minimum": 0,
          "maximum": 100
        },
        "protective_instinct_level": {
          "type": "integer",
          "minimum": 0,
          "maximum": 100
        },
        "fire_force_energy": {
          "type": "boolean"
        }
      }
    }
  }
},
  "obi_output_example": {
  "mission_status": {
    "current_phase": "evidence_correlation",
    "completion_percentage": 67,
    "critical_milestones": [
      "Timeline validation",
      "Witness verification"
    ],
    "blockers_identified": [
      "Missing historical records"
    ]
  },
  "team_performance": {
    "specialist_metrics": [
      {
        "specialist_id": "estrategista_chefe",
        "performance_score": 94,
        "tasks_completed": 8,
        "quality_rating": 9,
        "current_status": "available"
      }
    ]
  },
  "obi_characteristics": {
    "leadership_mode": "coordination",
    "team_morale_level": 85,
    "protective_instinct_level": 78,
    "fire_force_energy": true
  }
},
  "vault_record_schema": {
  "type": "object",
  "required": [
    "tipo_registro",
    "autor",
    "dados",
    "timestamp",
    "confidence_score"
  ],
  "properties": {
    "tipo_registro": {
      "type": "string",
      "enum": [
        "evidencia",
        "hipotese",
        "perfil_personagem",
        "entrada_timeline",
        "registro_misc"
      ]
    },
    "autor": {
      "type": "string",
      "enum": [
        "orquestrador_missao",
        "estrategista_chefe",
        "analista_forense",
        "analista_comportamental",
        "analista_espacial"
      ]
    },
    "dados": {
      "type": "object",
      "description": "Specialist-specific structured data following their schema"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "confidence_score": {
      "type": "integer",
      "minimum": 0,
      "maximum": 100
    },
    "priority_level": {
      "type": "string",
      "enum": [
        "critico",
        "alto",
        "medio",
        "baixo"
      ]
    },
    "cross_references": {
      "type": "array",
      "items": {
        "type": "string",
        "description": "IDs of related discoveries"
      }
    },
    "validation_status": {
      "type": "string",
      "enum": [
        "pending",
        "validated",
        "contradicted",
        "requires_review"
      ]
    },
    "quality_metrics": {
      "type": "object",
      "properties": {
        "bmad_compliance": {
          "type": "boolean"
        },
        "peer_reviewed": {
          "type": "boolean"
        },
        "methodology_sound": {
          "type": "boolean"
        }
      }
    }
  }
},
  "validation_triggers": {
  "pre_vault_storage": {
    "description": "Validate schema before storing in Vault",
    "action": "reject_invalid_data"
  },
  "post_analysis_generation": {
    "description": "Validate specialist output structure",
    "action": "request_correction_if_invalid"
  },
  "cross_validation_prep": {
    "description": "Ensure data ready for cross-validation",
    "action": "format_for_validation_engine"
  },
  "quality_gate_check": {
    "description": "BMAD quality framework compliance",
    "action": "flag_quality_issues"
  }
},
  "schema_validation_process": "1. \"Generate specialist analysis (natural language + structured data)\" 2. \"Apply specialist-specific schema validation\" 3. \"Check universal record schema compliance\" 4. \"Validate cross-references and relationships\" 5. \"Verify BMAD quality framework adherence\" 6. \"Store in Vault with validation metadata\" 7. \"Update cross-reference links automatically\"",
  "validation_errors": {
  "schema_mismatch": {
    "error_code": "SCHEMA_001",
    "description": "Output doesn't match specialist schema",
    "recovery": "request_specialist_reformat"
  },
  "missing_required_fields": {
    "error_code": "SCHEMA_002",
    "description": "Required fields not populated",
    "recovery": "auto_prompt_for_missing_data"
  },
  "confidence_score_invalid": {
    "error_code": "SCHEMA_003",
    "description": "Confidence score outside 0-100 range",
    "recovery": "normalize_to_valid_range"
  },
  "cross_reference_broken": {
    "error_code": "SCHEMA_004",
    "description": "Referenced discovery doesn't exist",
    "recovery": "remove_invalid_reference"
  }
},
  "validation_integration": {
  "schema_preparation": {
    "description": "Structured data ready for cross-validation",
    "format": "JSON objects following specialist schemas"
  },
  "validation_output": {
    "description": "Validation results in structured format",
    "schema": "validation_result_schema"
  },
  "consensus_building": {
    "description": "Structured synthesis of multiple specialist inputs",
    "format": "consensus_schema with confidence aggregation"
  }
},
  "qa_integration": {
  "context_enrichment": {
    "description": "Q&A results structured for schema population",
    "process": "fill_missing_schema_fields_via_qa"
  },
  "refinement_tracking": {
    "description": "Track how Q&A improves data quality",
    "metrics": "schema_completeness_before_after"
  }
},
  "template_integration": {
  "dual_output": {
    "description": "Templates generate both narrative + structured data",
    "process": "narrative_for_user + json_for_vault"
  },
  "schema_compliance": {
    "description": "All templates follow their specialist schemas",
    "validation": "automatic_schema_check_on_generation"
  }
},
  "compliance_tracking": {
  "schema_adherence_rate": {
    "target": ">95% outputs follow correct schema",
    "measurement": "validated_outputs / total_outputs"
  },
  "data_completeness": {
    "target": ">90% required fields populated",
    "measurement": "populated_required_fields / total_required_fields"
  },
  "cross_reference_accuracy": {
    "target": ">98% references valid",
    "measurement": "valid_references / total_references"
  },
  "validation_efficiency": {
    "target": "<2s average validation time",
    "measurement": "total_validation_time / validation_count"
  }
},
  "improvement_metrics": {
  "schema_evolution": {
    "description": "Track schema improvements over time",
    "measurement": "schema_version_effectiveness"
  },
  "error_reduction": {
    "description": "Decreasing validation errors",
    "target": "-50% validation errors month-over-month"
  },
  "specialist_adaptation": {
    "description": "How well specialists adapt to structured output",
    "measurement": "specialist_schema_compliance_rate"
  }
},
  "analysis_schemas": {
  "enabled": true,
  "validation_mode": "strict",
  "auto_correction": true,
  "specialist_schemas": {
    "estrategista_chefe": "strategic_analysis_schema",
    "analista_forense": "forensic_analysis_schema",
    "analista_comportamental": "psychological_analysis_schema",
    "analista_espacial": "tactical_analysis_schema",
    "orquestrador_missao": "coordination_schema"
  },
  "validation_settings": {
    "pre_vault_validation": true,
    "schema_compliance_required": true,
    "auto_cross_reference": true,
    "quality_gate_enforcement": true
  }
},
  "failure_scenarios": {
  "specialist_output_malformed": {
    "cause": "Specialist generates unstructured output",
    "response": "Guide specialist to include structured data",
    "fallback": "Manual structure extraction from narrative"
  },
  "schema_version_mismatch": {
    "cause": "Using outdated schema version",
    "response": "Auto-upgrade to current schema version",
    "fallback": "Compatibility mode with warnings"
  },
  "vault_integration_failure": {
    "cause": "Structured data incompatible with Vault API",
    "response": "Transform to vault-compatible format",
    "fallback": "Store as unstructured with metadata flags"
  }
},
};
