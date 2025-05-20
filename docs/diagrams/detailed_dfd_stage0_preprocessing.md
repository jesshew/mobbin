```mermaid
graph TD
    A[Raw Screenshot File/Buffer] --> B{Input Validation};
    B --> C{Aspect-Ratio Preserving Resize};
    C --> D{White Padding Addition};
    D --> E{JPEG Optimization};
    E --> F{Filename Sanitization};
    F -- Sanitized Filename --> G[Stored Sanitized Filename];
    E -- Optimized Image Buffer --> H{Storage Preparation};
    H --> I[Stored Processed Image (Buffer/Blob)];
    H -- Storage URL --> J[Stored Image URL];

    subgraph "Input"
        A
    end

    subgraph "Preprocessing Operations (ImageProcessor.ts)"
        B
        C
        D
        E
        F
        H
    end

    subgraph "Outputs"
        G
        I
        J
    end

    style A fill:#lightgrey,stroke:#333,stroke-width:2px
    style G fill:#lightblue,stroke:#333,stroke-width:2px
    style I fill:#lightblue,stroke:#333,stroke-width:2px
    style J fill:#lightblue,stroke:#333,stroke-width:2px
``` 