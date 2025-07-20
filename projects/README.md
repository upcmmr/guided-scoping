# User Projects Directory

This directory is intended for user project files saved from the Project Scoping Tool.

## File Structure

- **Template Files**: Located in `../project_templates/` (for admins)
- **User Project Files**: Saved here by end users (contains customized project configurations)

## Project File Format

User project files contain:
- Customized project settings (team size, sprint length, etc.)
- Scope items with individual `selected: true/false` fields
- Original template source information  
- Creation and modification timestamps

### Key Differences from Templates:
- **Scope Items**: Include `selected` boolean field instead of `small/medium/large` flags
- **No S/M/L Fields**: Template complexity indicators are removed in user projects
- **Embedded Selection**: Selection state is stored within each scope item

## Usage

When users customize a template and save their project, the files will be saved with names like:
- `My-E-commerce-Project.json`
- `B2B-Platform-v2.json` 
- etc.

These files can be loaded back into the tool to continue working on the project scope and estimates. 