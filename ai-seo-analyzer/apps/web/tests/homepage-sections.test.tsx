import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Home from "@/app/page";

describe("Homepage sections (Category 02, Step 03)", () => {
  it("communicates what the tool does, who it's for, and what happens next, all above/around the one primary action", () => {
    render(<Home />);

    expect(screen.getByText(/for website owners with zero seo experience/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /know what's holding your website back/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/no signup required/i)).toBeInTheDocument();
  });

  it("never makes an exaggerated or guaranteed-ranking claim anywhere on the page", () => {
    render(<Home />);
    const bodyText = document.body.textContent ?? "";
    expect(bodyText).not.toMatch(/guarantee(d)?\s+(google\s+)?ranking/i);
    expect(bodyText).not.toMatch(/100% accurate/i);
    expect(bodyText).not.toMatch(/guaranteed seo success/i);
    // The one place "guarantee" may appear is the honest disclaimer that we don't offer one.
    expect(bodyText).toMatch(/never guarantee where you'll rank/i);
  });

  it("explains the process in four plain steps and notes that some data may be estimated or unavailable", () => {
    render(<Home />);

    const heading = screen.getByRole("heading", { name: /how it works/i });
    const section = heading.closest("section");
    expect(section).not.toBeNull();
    const within = section as HTMLElement;

    expect(screen.getByText("Enter your website")).toBeInTheDocument();
    expect(within.textContent).toMatch(/we check available website data/i);
    expect(within.textContent).toMatch(/we explain the problems/i);
    expect(within.textContent).toMatch(/we guide you through the fixes/i);
    expect(within.textContent).toMatch(/may be estimated or unavailable/i);
  });

  it("keeps the 'What is SEO?' explanation collapsed by default, opens on click, and stays short", () => {
    render(<Home />);

    const trigger = screen.getByText(/what is seo\?/i);
    const details = trigger.closest("details") as HTMLDetailsElement;
    expect(details).not.toBeNull();
    expect(details.open).toBe(false);

    fireEvent.click(trigger);

    expect(details.open).toBe(true);
    expect(details.textContent).toMatch(/search engine optimization/i);
    // Keep it genuinely short - not a long educational article.
    expect(details.textContent?.length ?? 0).toBeLessThan(600);
  });

  it("plainly states the data-accuracy and trust expectations without sounding frightening", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: /good to know before you start/i })).toBeInTheDocument();
    expect(screen.getByText(/publicly available on your website/i)).toBeInTheDocument();
    expect(screen.getByText(/connect your own account/i)).toBeInTheDocument();
    expect(screen.getByText(/traffic and advertising history aren't always available/i)).toBeInTheDocument();
    expect(screen.getByText(/clearly labeled as an estimate/i)).toBeInTheDocument();
    expect(screen.getByText(/never guarantee where you'll rank/i)).toBeInTheDocument();
  });

  it("still shows exactly one primary action button on the whole page", () => {
    render(<Home />);
    expect(screen.getAllByRole("button", { name: /^analyze website$/i })).toHaveLength(1);
  });

  it("does not fake fetch calls or a network request from clicking the collapsible sections", () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    render(<Home />);
    fireEvent.click(screen.getByText(/what is seo\?/i));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
