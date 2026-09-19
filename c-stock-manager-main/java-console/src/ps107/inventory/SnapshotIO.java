package ps107.inventory;

import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;

final class SnapshotIO {
    private SnapshotIO() {
    }

    static void write(Path path, InventorySnapshot snapshot) throws IOException {
        try (ObjectOutputStream outputStream = new ObjectOutputStream(Files.newOutputStream(path))) {
            outputStream.writeObject(snapshot);
        }
    }

    static InventorySnapshot read(Path path) throws IOException, ClassNotFoundException {
        try (ObjectInputStream inputStream = new ObjectInputStream(Files.newInputStream(path))) {
            return (InventorySnapshot) inputStream.readObject();
        }
    }
}