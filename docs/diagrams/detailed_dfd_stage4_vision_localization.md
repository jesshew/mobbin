```mermaid
graph TD
    A[Anchor-Rich Descriptions] --> C{MoondreamDetectionService.detectBoundingBoxes};
    B[Processed Image] --> C;
    C -- Raw Bounding Boxes & Confidence Scores --> D{BoundingBoxService.drawBoundingBoxesOnImage};
    B --> D; 
    D -- Annotated Screenshot Image --> E[Stored Annotated Screenshot- PNG ];
    C -- Raw Bounding Boxes & Confidence Scores --> F{Result Normalization & Formatting};
    F -- Formatted Data --> G[Array {id, label, coordinates, score, status}];

    subgraph "Inputs"
        A
        B
    end

    subgraph "Vision Localization Operations"
        C
        D
        F
    end

    subgraph "Outputs"
        E
        G
    end

    style A fill:#lightgrey,stroke:#333,stroke-width:2px;
    style B fill:#lightgrey,stroke:#333,stroke-width:2px;
    style E fill:#lightblue,stroke:#333,stroke-width:2px;
    style G fill:#lightblue,stroke:#333,stroke-width:2px;
``` 
