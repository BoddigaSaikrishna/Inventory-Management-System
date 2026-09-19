# PS-107 Java Inventory Console

This workspace now includes a Java console application that matches the PS-107 capstone brief:

- product and category abstraction
- receive/issue stock operations with stock-out exceptions
- SKU-based inventory tracking and low-stock alerts
- supplier records
- snapshot export/import to disk
- menu-driven console interaction

## Run
The Java app is located in `java-console/`.

Compile and run from that folder with a JDK installed:

```powershell
Set-Location 'c:\Users\bsaik\Desktop\Projects\Inventory Management\c-stock-manager-main'
$sources = Get-ChildItem -Recurse 'java-console\src' -Filter *.java | ForEach-Object { $_.FullName }
javac -d 'java-console\out' @sources
java -cp 'java-console\out' ps107.inventory.Main
```

The existing React files remain in the workspace, but the PS-107 solution lives in the Java console app.
