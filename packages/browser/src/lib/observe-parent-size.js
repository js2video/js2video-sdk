function observeParentSize(element, callback = console.log) {
  const parent = element.parentElement;
  if (!parent) {
    console.warn("Element has no parent");
    return;
  }

  // Initial size report
  const reportSize = () => {
    const rect = parent.getBoundingClientRect();
    callback({ width: rect.width, height: rect.height });
  };

  reportSize(); // Report once on init

  // Set up ResizeObserver
  const observer = new ResizeObserver(() => {
    reportSize();
  });

  observer.observe(parent);

  // Optional: return cleanup function
  return () => observer.disconnect();
}

export { observeParentSize };
