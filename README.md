
# Crowdsourced Litter Pickup Website

We are building a crowdsourced litter-pickup site where residents geotag areas with heavy trash. Shared data helps volunteers and officials prioritize cleanups. The platform combines front-end, backend, and engagement features to support cleaner public spaces.

## Team Members
- Zach Reising (CS) [reisinzs@mail.UC.edu](mailto:reisinzs@mail.UC.edu)
- Jacob Towne (CS) [townejd@mail.UC.edu](mailto:townejd@mail.UC.edu)
- Tommy Tuttle (CS) [tuttlett@mail.UC.edu](mailto:tuttlett@mail.UC.edu)
- Michael Mazzella (CS) [mazzelma@mail.UC.edu](mailto:mazzelma@mail.UC.edu)

## Project Advisor
- Dr. Badri Vellambi [badri.vellambi@uc.edu](mailto:badri.vellambi@uc.edu)

## Table of Contents

1. [Project Description](./Project-Desccription.md)
2. [User Stories and Design Diagrams](./DesignDiagrams/)
    - [User Stories](./DesignDiagrams/User_Stories.md)
    - [Level 0 Diagram](./DesignDiagrams/Design_D0.png)
      - D0 represents the simplest system version with three core parts:
      - Client (Website): User-facing interface that sends requests and displays data.
      - Server (Backend API): Processes client requests and communicates with the database.
      - Database: Stores user data and marker data.
    - [Level 1 Diagram](./DesignDiagrams/Design_D1.png)
      - D1 expands the system to support mapping features and more complex user interactions:
      - User Interface: Sends reports or data requests and renders returned information.
      - Backend API & Logic: Handles data processing, generates map data, and interacts with storage.
      - Interactive Map: Receives generated map data from the backend and displays the map to users.
      - Database: Stores reports, marker data, and other persistent records.
    - [Level 2 Diagram](./DesignDiagrams/Design_D2.png)
      - D2 introduces authentication, roles, and expanded functionality inside the UI:
      - Log In / Sign Up & User: Provides authentication and manages user accounts.
      - User Interface: Central hub for all user actions, including:
        - Report: Submit new cleanup reports with details and photos.
        - Search/Filter: Locate markers using criteria such as status or location.
        - Resolve Markers: Upload cleanup evidence and resolution data.
        - Organizations: Allow organization leaders to manage cleanup activities.
        - Administrators: Assign and manage user roles.
      - Backend: Processes UI requests and performs all logic before contacting the database.
      - Database: Stores user accounts, map/marker details, cleanup status, and other system data.
3. Project Tasks and Timeline
    - [Task List](./Homework/TaskList.md)
    - [Milestones, Timeline, and Effort Matrix](./Homework/Milestones,%20Timeline%20and%20Effort%20Matrix.md)
4. [ABET Concerns Essay](./Homework/Project%20Constraints%20Essay.md)
5. [PPT Slideshow](./Homework/Assignment%208%20SlideShow.pptx)
6. [Self-Assessment Essays](./Homework/IndividualCapstoneAssesment/)
7. [Professional Biographies](./ProfessionalBios/)
8. Budget
    - No expenses
9. Appendix