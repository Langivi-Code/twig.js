import express from "express";
import { twig } from "twig";
const app = express();
const port = 3000;

app.get("/", async (req, res) => {
  try {
    const template = await twig.renderToString.call(
      twig,
      "./views/pages/index.twig"
    );
    res.send(template);
  } catch (e) {
    console.log("ERROR", e);
  }
});

app.listen(port, () => console.log("Listen port 3000"));
