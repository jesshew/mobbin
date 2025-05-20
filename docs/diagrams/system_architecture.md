```mermaid
graph TD
    A[User] --> B(Next.js Frontend);
    B --> C{Backend API (Next.js)};
    C --> D[ScreenshotProcessor];
    D --> E[ImageProcessor];
    D --> F[ClaudeAIService];
    D --> G[MoondreamDetectionService];
    D --> H[DatabaseService];
    D --> I[File Storage (e.g., S3)];
    E --> I;
    H --> J[Database];

    subgraph "Application Services"
        C
        D
        E
        H
    end

    subgraph "AI/VLM Services"
        F
        G
    end

    subgraph "Data Stores"
        I
        J
    end

    style B fill:#f9f,stroke:#333,stroke-width:2px;
    style F fill:#ccf,stroke:#333,stroke-width:2px;
    style G fill:#ccf,stroke:#333,stroke-width:2px;
    style J fill:#lightgrey,stroke:#333,stroke-width:2px;
    style I fill:#lightgrey,stroke:#333,stroke-width:2px;
``` 