## Project Goals

- Create a comprehensive POC management platform
- Enable efficient tracking and management of POCs
- Provide clear visibility into POC progress and success rates
- Facilitate collaboration between sales engineers and customers
- Integrate with existing tools (Salesforce, Slack, Jira)
- Ensuring robust and secure authentication
- Managing complex API integrations
- Maintaining performance with multiple external services
- Handling rate limits and API quotas
- Implementing flexible, role-based access control
- Creating reliable retry mechanisms for external service calls
- Securely managing OAuth 2.0 tokens
- Implementing real-time notification systems
- Comprehensive security and error handling
- User experience in authentication flows
- Ensuring comprehensive test coverage
- Managing state and data flow between components
- Handling asynchronous operations and error states
- Maintaining a responsive and user-friendly UI


- **Overall Structure:**
    
    - **Tabbed Navigation:** Allows for different dashboards/views (e.g., "Global SE Dashboard," "Global SE Pilot Dashboard").
        
    - **Header:** Includes search, action buttons, user settings, notifications, global controls.
        
    - **Card-based Layout:** Uses individual widgets/cards for different metrics.
        
    - **Filtering:** Allows for data segmentation based on criteria (e.g. "equals APAC" for the theatre).
        
- **Metrics and Charts:**
    
    - **Revenue Metrics:** Displays sales revenue by various categories (e.g., by SE, by probability, without SE)
        
    - **Account Lists:** Shows lists of accounts by specific conditions.
        
    - **Renewal Tracking:** Tracks upcoming renewals.
        
    - **Support Tickets:** Shows the count of escalated support tickets.
        
    - **Customer Base:** Charts customer distribution by territory.
        
    - **Churn Metrics:** Tracks churned accounts.
        
    - **Pilot Metrics:** Shows the number, status, and value of active pilot programs.