package ps107.inventory.model;

import java.io.Serializable;

public abstract class Category implements Serializable {
    private static final long serialVersionUID = 1L;

    private final String id;
    private final String name;
    private final String description;

    protected Category(String id, String name, String description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public abstract String getKind();
}