import opine from "https://deno.land/x/opine@2.1.3/mod.ts";
import {twig} from "../../src/twig.js";
const app = opine();

app.engine('twig', twig.renderToString.bind(twig));
app.set('views',"./view");
app.set('view engine', 'twig');
app.set('view cache', true);

app.get('/',function(req,res){
    res.render("base.twig",{arr:[1,2,3]})
});
app.get('/filters',function(req,res){
    res.render("filters.twig");
})

app.get('/functions',function(req,res){
    res.render("functions.twig");
})

app.get('/tests', function(req,res){
    res.render("tests.twig");
})

app.get('/tags', function(req,res){
    res.render("tags.twig");
})

app.listen(3001);
console.log("Deno started on 3001 port!");