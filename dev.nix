{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  # Packages available in the development environment
  buildInputs = [
    pkgs.nodejs_20  # Node.js (includes npm), common for Next.js projects
    # Add other system dependencies if needed by the project.
    # For example, if your project needs git: pkgs.git

    pkgs.bitmagnet   # Added as per user request
  ];

  # Environment variables or shell commands to run when the shell is activated
  shellHook = ''
    echo "Nix development environment activated."
    echo "Node version: $(node --version)"
    echo "npm version: $(npm --version)"
    echo "You can now run your development commands, e.g., npm run dev"
  '';
}
