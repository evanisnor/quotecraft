import "./index";

describe("QuoteCraft widget", () => {
  it("registers the quotecraft-widget custom element", () => {
    expect(customElements.get("quotecraft-widget")).toBeDefined();
  });

  it("creates a shadow root on instantiation", () => {
    const element = document.createElement("quotecraft-widget");
    document.body.appendChild(element);
    expect(element.shadowRoot).not.toBeNull();
    document.body.removeChild(element);
  });
});
