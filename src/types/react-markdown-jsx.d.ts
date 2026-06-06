// Lightweight ambient JSX declaration to help third-party libs referencing JSX.IntrinsicElements
// This avoids TypeScript errors coming from node_modules like react-markdown when JSX types
// are not resolvable due to environment differences.

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
