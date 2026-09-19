package ps107.inventory.model;

public final class DepartmentCategory extends Category {
    private static final long serialVersionUID = 1L;

    public DepartmentCategory(String id, String name, String description) {
        super(id, name, description);
    }

    @Override
    public String getKind() {
        return "department";
    }
}