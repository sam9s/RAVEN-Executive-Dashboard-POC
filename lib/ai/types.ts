
export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AITool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: string
      properties: Record<string, any>
      required?: string[]
    }
  }
}

export interface AIResponse {
  model: string
  message: {
    role: string
    content: string
    tool_calls?: Array<{
      function: {
        name: string
        arguments: string
      }
    }>
  }
  done: boolean
}

// Define available tools for the AI (Shared between Ollama and OpenAI)
export const aiTools: AITool[] = [
  {
    type: 'function',
    function: {
      name: 'get_clients',
      description: 'Get list of clients from the CRM database',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Filter by status: lead, qualified, proposal, won, lost, or all',
            enum: ['lead', 'qualified', 'proposal', 'won', 'lost', 'all']
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_projects',
      description: 'Get list of projects',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Filter by status: planning, active, on_hold, completed, or all',
            enum: ['planning', 'active', 'on_hold', 'completed', 'all']
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_invoices',
      description: 'Get list of invoices',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Filter by status: draft, sent, paid, overdue, or all',
            enum: ['draft', 'sent', 'paid', 'overdue', 'all']
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_calendar_events',
      description: 'Get upcoming calendar events',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Number of days to look ahead (default: 7)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_clickup_tasks',
      description: 'Get tasks from ClickUp',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'send_email',
      description: 'Send an email to someone',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
          subject: { type: 'string', description: 'Email subject' },
          body: { type: 'string', description: 'Email body content' }
        },
        required: ['to', 'subject', 'body']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_dashboard_stats',
      description: 'Get dashboard statistics and KPIs',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_clients',
      description: 'Search for clients by name, company, or email',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search term (name, company, or email)'
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_client_details',
      description: 'Get detailed information about a specific client including their projects and invoices',
      parameters: {
        type: 'object',
        properties: {
          client_id: {
            type: 'string',
            description: 'The UUID of the client'
          }
        },
        required: ['client_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_emails',
      description: 'Get recent emails from the inbox',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of emails to fetch (default: 5)'
          },
          search: {
            type: 'string',
            description: 'Optional search term to filter emails'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_full_summary',
      description: 'Get a comprehensive summary of the business including all key metrics, active projects overview, and urgent items',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_invoice',
      description: 'Create a new invoice for a client',
      parameters: {
        type: 'object',
        properties: {
          client_name: { type: 'string', description: 'Name of the client (will search for matching client)' },
          amount: { type: 'number', description: 'Invoice amount in dollars' },
          due_days: { type: 'number', description: 'Number of days until due (default: 30)' }
        },
        required: ['client_name', 'amount']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_project',
      description: 'Create a new project',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Project name' },
          budget: { type: 'number', description: 'Project budget in dollars' },
          due_date: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
          notes: { type: 'string', description: 'Project notes or description' }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_calendar_event',
      description: 'Create a new calendar event or meeting',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Event title' },
          date: { type: 'string', description: 'Event date in YYYY-MM-DD format' },
          time: { type: 'string', description: 'Start time in HH:MM format (24h)' },
          duration_hours: { type: 'number', description: 'Duration in hours (default: 1)' },
          location: { type: 'string', description: 'Event location (optional)' }
        },
        required: ['title', 'date', 'time']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_calendar_event',
      description: 'Delete/cancel a calendar event',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title of the event to delete (fuzzy match)' },
          date: { type: 'string', description: 'Date of the event to delete (YYYY-MM-DD)' },
          time: { type: 'string', description: 'Time of the event (optional, helps disambiguate)' }
        },
        required: ['title', 'date']
      }
    }
  }
]
