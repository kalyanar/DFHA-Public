// evaluation/DomainTemplates.js
// Domain-specific templates for synthetic trace generation

class DomainTemplates {
    constructor() {
        this.templates = {
            it_support: this.getITSupportTemplates(),
            financial: this.getFinancialTemplates(),
            healthcare: this.getHealthcareTemplates(),
            ecommerce: this.getEcommerceTemplates()
        };
    }
    
    getAllDomains() {
        return Object.keys(this.templates);
    }
    
    getPatternNames(domain) {
        return Object.keys(this.templates[domain] || {});
    }
    
    getTemplate(domain, patternName) {
        return this.templates[domain]?.[patternName];
    }
    
    getITSupportTemplates() {
        return {
            investigate_incident: {
                name: 'investigate_incident',
                queryTemplates: [
                    'Investigate {issue} in {component}',
                    'Check why {service} is experiencing {issue}',
                    'Debug {issue} affecting {application}'
                ],
                baseSequence: [
                    'fetch_logs',
                    'analyze_error_patterns',
                    'check_dependencies',
                    'identify_root_cause'
                ],
                inputSchema: {
                    issue: 'string',
                    component: 'string',
                    severity: 'enum:critical|high|medium|low',
                    timeframe: 'string'
                },
                conditionalTasks: {
                    'check_recent_deployments': 'if severity=critical',
                    'notify_team': 'if severity=critical|high'
                }
            },
            
            trace_transaction: {
                name: 'trace_transaction',
                queryTemplates: [
                    'Trace transaction {transaction_id}',
                    'Track {transaction_id} through the system',
                    'Find path of {transaction_id}'
                ],
                baseSequence: [
                    'fetch_transaction_logs',
                    'extract_service_calls',
                    'build_call_chain',
                    'identify_bottlenecks'
                ],
                inputSchema: {
                    transaction_id: 'string',
                    timeframe: 'string'
                },
                conditionalTasks: {
                    'fetch_database_metrics': 'if has_db_calls',
                    'analyze_cache_hits': 'if has_cache_access'
                }
            },
            
            analyze_performance: {
                name: 'analyze_performance',
                queryTemplates: [
                    'Analyze performance of {endpoint}',
                    'Check response times for {service}',
                    'Why is {component} slow?'
                ],
                baseSequence: [
                    'fetch_metrics',
                    'compute_percentiles',
                    'identify_outliers',
                    'generate_recommendations'
                ],
                inputSchema: {
                    endpoint: 'string',
                    timeframe: 'string',
                    threshold: 'number'
                },
                conditionalTasks: {
                    'check_resource_usage': 'if p95 > threshold',
                    'analyze_query_plans': 'if has_database'
                }
            }
        };
    }
    
    getFinancialTemplates() {
        return {
            fraud_detection: {
                name: 'fraud_detection',
                queryTemplates: [
                    'Check transaction {txn_id} for fraud',
                    'Is {txn_id} fraudulent?',
                    'Verify transaction {txn_id}'
                ],
                baseSequence: [
                    'fetch_transaction_details',
                    'check_velocity_rules',
                    'verify_merchant',
                    'compute_risk_score',
                    'make_decision'
                ],
                inputSchema: {
                    txn_id: 'string',
                    amount: 'number',
                    merchant: 'string',
                    account_id: 'string'
                },
                conditionalTasks: {
                    'verify_device': 'if amount > 1000',
                    'check_geolocation': 'if new_merchant',
                    'request_mfa': 'if risk_score > 0.7'
                }
            },
            
            credit_application: {
                name: 'credit_application',
                queryTemplates: [
                    'Process credit application {app_id}',
                    'Review loan application for {customer}',
                    'Evaluate credit request {app_id}'
                ],
                baseSequence: [
                    'fetch_applicant_data',
                    'check_credit_score',
                    'verify_income',
                    'assess_debt_ratio',
                    'make_decision'
                ],
                inputSchema: {
                    app_id: 'string',
                    customer: 'string',
                    amount: 'number',
                    term: 'number'
                },
                conditionalTasks: {
                    'manual_review': 'if borderline_score',
                    'verify_employment': 'if self_employed',
                    'request_collateral': 'if amount > 50000'
                }
            },
            
            account_reconciliation: {
                name: 'account_reconciliation',
                queryTemplates: [
                    'Reconcile account {account_id}',
                    'Check balance for {account_id}',
                    'Verify transactions for {customer_id}'
                ],
                baseSequence: [
                    'fetch_transactions',
                    'compute_balance',
                    'compare_with_statement',
                    'identify_discrepancies'
                ],
                inputSchema: {
                    account_id: 'string',
                    start_date: 'string',
                    end_date: 'string'
                },
                conditionalTasks: {
                    'investigate_discrepancy': 'if has_discrepancies',
                    'notify_customer': 'if major_discrepancy'
                }
            }
        };
    }
    
    getHealthcareTemplates() {
        return {
            triage_patient: {
                name: 'triage_patient',
                queryTemplates: [
                    'Triage patient with {symptoms}',
                    'What urgency for patient with {symptoms}?',
                    'Assess {patient_id} presenting {symptoms}'
                ],
                baseSequence: [
                    'collect_symptoms',
                    'assess_vital_signs',
                    'check_medical_history',
                    'compute_severity_score',
                    'assign_priority'
                ],
                inputSchema: {
                    patient_id: 'string',
                    symptoms: 'array',
                    vital_signs: 'object'
                },
                conditionalTasks: {
                    'call_emergency_response': 'if severity=critical',
                    'check_allergies': 'if requires_medication',
                    'notify_specialist': 'if requires_specialist'
                }
            },
            
            medication_review: {
                name: 'medication_review',
                queryTemplates: [
                    'Review medications for {patient}',
                    'Check drug interactions for {patient_id}',
                    'Verify {medications} for patient'
                ],
                baseSequence: [
                    'fetch_current_medications',
                    'check_drug_interactions',
                    'verify_dosages',
                    'assess_contraindications'
                ],
                inputSchema: {
                    patient_id: 'string',
                    medications: 'array',
                    conditions: 'array'
                },
                conditionalTasks: {
                    'consult_pharmacist': 'if has_interactions',
                    'adjust_dosage': 'if has_contraindications'
                }
            },
            
            lab_result_analysis: {
                name: 'lab_result_analysis',
                queryTemplates: [
                    'Analyze {test_type} results for {patient}',
                    'Review lab results for {patient_id}',
                    'Interpret {test_type} for patient'
                ],
                baseSequence: [
                    'fetch_lab_results',
                    'compare_with_reference_ranges',
                    'identify_abnormalities',
                    'generate_interpretation'
                ],
                inputSchema: {
                    patient_id: 'string',
                    test_type: 'string',
                    results: 'object'
                },
                conditionalTasks: {
                    'flag_critical_values': 'if outside_critical_range',
                    'notify_physician': 'if abnormal',
                    'recommend_follow_up': 'if borderline'
                }
            }
        };
    }
    
    getEcommerceTemplates() {
        return {
            order_fulfillment: {
                name: 'order_fulfillment',
                queryTemplates: [
                    'Process order {order_id}',
                    'Fulfill {order_id}',
                    'Ship order {order_id}'
                ],
                baseSequence: [
                    'validate_order',
                    'check_inventory',
                    'reserve_items',
                    'calculate_shipping',
                    'generate_label'
                ],
                inputSchema: {
                    order_id: 'string',
                    items: 'array',
                    shipping_address: 'object'
                },
                conditionalTasks: {
                    'split_shipment': 'if multi_warehouse',
                    'apply_expedited_shipping': 'if priority_customer',
                    'notify_backorder': 'if insufficient_inventory'
                }
            },
            
            return_processing: {
                name: 'return_processing',
                queryTemplates: [
                    'Process return for {order_id}',
                    'Handle return {tracking_number}',
                    'Refund order {order_id}'
                ],
                baseSequence: [
                    'validate_return_eligibility',
                    'inspect_items',
                    'process_refund',
                    'update_inventory'
                ],
                inputSchema: {
                    order_id: 'string',
                    tracking_number: 'string',
                    reason: 'string'
                },
                conditionalTasks: {
                    'restock_item': 'if condition=new',
                    'process_exchange': 'if exchange_requested',
                    'flag_for_review': 'if high_value_item'
                }
            },
            
            product_recommendation: {
                name: 'product_recommendation',
                queryTemplates: [
                    'Recommend products for {product_category}',
                    'What products for customer in {product_category}?',
                    'Suggest items similar to {product_category}'
                ],
                baseSequence: [
                    'fetch_customer_history',
                    'analyze_preferences',
                    'query_product_catalog',
                    'compute_similarity_scores',
                    'rank_recommendations'
                ],
                inputSchema: {
                    customer_id: 'string',
                    product_category: 'string',
                    price_range: 'object'
                },
                conditionalTasks: {
                    'apply_personalization': 'if has_purchase_history',
                    'filter_by_availability': 'if in_stock_only',
                    'include_promotions': 'if has_active_promos'
                }
            }
        };
    }
}

module.exports = DomainTemplates;
