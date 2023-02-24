import express from "express";
import { twig } from "twig";
const app = express();
const port = 3000;

app.get("/", async (req, res) => {
  try {
    const template = await twig.renderToString.call(
      twig,
      "./views/base.twig"
    );
    res.send(template);
  } catch (e) {
    console.log("ERROR", e);
  }
});

app.get("/filters", async function (req, res) {
  try {
    const template = await twig.renderToString.call(
      twig,
      "./views/filters.twig"
    );
    res.send(template);
  } catch (e) {
    console.log("ERROR", e);
  }
});

app.get("/functions", async function (req, res) {
  try {
    const template = await twig.renderToString.call(
      twig,
      "./views/functions.twig"
    );
    res.send(template);
  } catch (e) {
    console.log("ERROR", e);
  }
});

app.get("/tests", async function (req, res) {
  try {
    const template = await twig.renderToString.call(
      twig,
      "./views/tests.twig"
    );
    res.send(template);
  } catch (e) {
    console.log("ERROR", e);
  }
});

app.get("/tags", async function (req, res) {
  try {
    const template = await twig.renderToString.call(
      twig,
      "./views/tags.twig"
    );
    res.send(template);
  } catch (e) {
    console.log("ERROR", e);
  }
});

app.listen(port, () => console.log("Listen port 3000"));
