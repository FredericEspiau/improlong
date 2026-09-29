import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { App } from "./App";

test("affiche le nom de l'app", () => {
  render(<App />);
  expect(screen.getByText("ImproLong")).toBeInTheDocument();
});
