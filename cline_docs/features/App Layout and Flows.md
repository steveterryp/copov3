1. **User Roles:** Will there be different user roles with different levels of access (e.g., Admin, Project Manager, Team Member)?
    
2. **Key Workflows:** What are the core actions users will perform most often? What is the user journey?

**App Layout and Flows**

Here's a potential app structure with flows to get you started:

1. **Authentication:**
    
    - **Flow:** Login/Signup page, user authentication with your backend.
        
    - **Questions:** How will users sign up, remember credentials?
        
    - **Presentation:** Secure and clear login UI
        
2. **Dashboard/Home:**
    
    - **Presentation:** This is the user's starting point after login. It can display an overview of active projects, pending tasks, and recent activity.
        
    - **Questions:**
        
        - Should a user be able to customise the dashboard?
            
        - Should it be role dependant?
            
3. **Project Section:**
    
    - **Flows:**
        
        - List Projects -> View Project (Details)
            
        - View Project -> Create Task
            
        - View Project -> List Tasks
            
        - View Project -> View Task (Details)
            
        - View Project -> View Users
            
        - View Project -> View Files
            
    - **Questions:**
        
        - How can users switch between projects?
            
        - Are there global tasks that are not tied to projects?
            
4. **User Management:**
    
    - **Flows:**
        
        - List Users -> View User Profile (Admin Only)
            
        - List Users -> Change Role
            
        - Create Users (Admin Only)
            
    - **Questions:**
        
        - How are roles assigned?
            
        - What levels of user permissions are required?
            
5. **Settings**
    
    - **Flows**
        
        - Update Password
            
        - Update user profile
            
        - Notifications
            
    - **Questions**
        
        - What customisable settings will the application support?
            
        - Can a user change theme preference?

**1. Expanded PoV Status & Tracking:**

- **Pilot Status:** Add "Projected", "Planned", "Installation", and "Configuration" as distinct status options with ability to track pilot stages.
    
- **Stalled Pilots:** Add the option to mark a PoV as "Stalled" and display stalled PoV count.
    
- **License Tracking:** Implement tracking for licenses issued for PoVs, and add alerts for expiring licenses.
    
- **Record Update Alerts:** Track when a PoV hasn't been updated for a while and create alerts.
    
- **Support Case Integration:** Link associated support tickets with PoVs and visualize their status.
    

**2. TSAM-Inspired Features (Customer Engagement):**

- **Engagement Tracking:** Track customer touchpoints, notes and activities in PoVs.
    
- **Account Health:** Assign health statuses to PoVs based on customer feedback, engagement, and performance.
    
- **Account Update Reminders:** Track when PoV account details need to be updated and create a notification/workflow.
    
- **End-of-Life Tracking:** For PoVs involving product or feature trials, track end-of-life status of relevant product.
    
- **Account Sharing:** Be able to share key project updates with key customer stakeholders
    

**3. Professional Services (PS) Implementation Tracking:**

- **Opportunity Tracking:** Track and integrate with any related sales opportunities linked to PoV's
    
- **Deployment Phases:** Track PoV implementation progress through various stages.
    
- **Territory Tracking:** Track PoVs by geographical region and customer territories.
    
- **At-Risk Project Identification:** Flag PoVs at risk of not meeting milestones or timelines based on pre-defined criteria and workflows.