# KM HTML Converter

A lightweight browser-based tool that converts copied Microsoft Word content into cleaner, Salesforce Knowledge-ready HTML.

This project was built as an internal workflow support tool for Knowledge Management writers who regularly migrate or prepare documentation for Salesforce Knowledge. It helps reduce repetitive formatting cleanup by converting pasted Word content into structured HTML that can be reviewed, edited, copied, and pasted into a Salesforce Knowledge source editor.

## Why I built this

Our KM workflow often involves moving drafted or reviewed article content from Microsoft Word into Salesforce Knowledge. Copying directly from Word can bring unnecessary styling, inconsistent spacing, messy table formatting, and Word-specific markup.

This tool was created to make that handoff cleaner and faster for writers by giving them a simple way to:

* Paste copied Word content
* Convert it into cleaner HTML
* Preview the rendered output
* Review warnings for images, nested tables, uneven rows, code blocks, and other items needing review
* Edit the HTML before copying
* Copy the final HTML for Salesforce Knowledge

## What it does

* Captures rich HTML content pasted from Microsoft Word (including content from Word Online)
* Removes Word-specific markup (MSO styles, metadata, namespace attributes)
* Converts headings, paragraphs, lists, links, tables, blockquotes, and pre-formatted content into clean HTML
* Detects and converts common code patterns (JSON, HTTP requests, indented code) to code blocks
* Preserves table structures, including merged cells and headers
* Detects images and replaces them with text placeholders
* Automatically detects and rebuilds list nesting from Word native and Word Online formatting
* Detects manually typed lists (numbered markers like "1.", "a)", etc.) and converts them to proper lists
* Detects unsafe link protocols and removes them while preserving link text
* Detects empty paragraphs and collapses consecutive empty lines
* Provides real-time preview of rendered output
* Allows manual marking of selected text as code blocks
* Logs warnings and informational messages for items needing review
* Provides copy button for the final HTML output

## Key features

### Word-to-HTML cleanup

The converter removes Word-generated markup (Word namespaces, style attributes, metadata) and outputs cleaner HTML with consistent inline styling and Arial font defaults matching Salesforce Knowledge style guidelines.

### Smart list reconstruction

Word exports lists in several formats depending on the Word version and export method. The tool detects and rebuilds:

* Word native list structures with level metadata
* Word Online (Office 365) list formats with level metadata
* Manually typed lists (1., 2., a), b), etc.) converted to proper nested lists

### Salesforce Knowledge-ready output

The generated HTML uses simple formatting intended for Salesforce Knowledge source code, including Arial font styling, table borders, heading hierarchy, and readable paragraph formatting.

### Table handling

The tool preserves common table structures, including:

* Header rows (detected and styled as table headers)
* Empty cells
* Uneven rows (different cell counts per row)
* Merged cells with colspan/rowspan attributes
* Nested tables (converted but flagged for review)

### Intelligent code block detection

The converter detects code-like content and converts it to code blocks:

* JSON blocks (multiline or single line)
* HTTP requests and responses
* Tab-indented or monospace text
* Manually marked selections (via "Mark selection as code" button)

### Warning panel

The warning panel helps writers catch items that need manual review, such as:

* Images (marked as [Insert image here] placeholders)
* Nested tables (preserved but require review)
* Uneven table rows (structure preserved as is)
* Merged table cells (colspan/rowspan preserved)
* Code blocks (auto-detected patterns)
* Unsupported link protocols (removed, text preserved)
* Word markup artifacts (styles, metadata stripped)
* List nesting reconstructions

Warnings are categorized as errors, warnings, and informational messages.

### Live paste preview and editing

The paste area shows the original Word content as it will be rendered. You can edit the content before conversion if needed. A live counter tracks the status of the conversion process.

### Manual code marking

Writers can select text in the paste preview and mark it as code before conversion, which outputs the selection as a proper code block.

## Tech stack

* HTML
* CSS
* Vanilla JavaScript

No framework, build tool, package manager, or backend is required.

## How to use

1. Open `km-html-converter_3.html` in a browser.
2. Copy content from Microsoft Word (any Word version or Word Online).
3. Paste the content into the paste area using Ctrl+V or Cmd+V.
4. (Optional) Select any text you want to mark as code and click "Mark selection as code".
5. Click "Convert to HTML".
6. Review the rendered preview in the middle column.
7. Check the warnings panel for items that need manual review.
8. Edit the HTML output in the right column if needed.
9. Click "Copy HTML".
10. Paste the HTML into the Salesforce Knowledge source editor.

## Project scope

This is a small internal productivity tool, not a full publishing system. It is designed to support a specific KM workflow: preparing cleaner HTML from Word-based article drafts for Salesforce Knowledge.

## Portfolio note

This project demonstrates practical workflow automation, documentation operations thinking, and the ability to build small tools that reduce repetitive cleanup work for a content or KM team. It also showcases understanding of how different Word export formats handle lists, tables, and styling, and the ability to detect and handle edge cases in converted content.
