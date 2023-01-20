import { assertEquals, assertThrows} from "https://deno.land/std@0.143.0/testing/asserts.ts";
import { twig } from "../src/twig.js";

Deno.test('Twig.js Path ->', async (t) => {
    let relativePath;

    (function () {
        relativePath = twig.path.relativePath;
    })();

    await t.step('relativePath -> should throw an error if trying to get a relative path in an inline template', function () {
        /* eslint-disable-next-line no-use-extend-native/no-use-extend-native */
        assertThrows(function () {
            relativePath({});
        },'Cannot extend an inline template.');
    });

    await t.step('should give the full path to a file when file is passed', function () {
        assertEquals(relativePath({url: 'http://www.test.com/test.twig'}, 'templates/myFile.twig'), 'http://www.test.com/templates/myFile.twig');
        assertEquals(relativePath({path: 'test/test.twig'}, 'templates/myFile.twig'), ('test/templates/myFile.twig'));
    });

    await t.step('should ascend directories', function () {
        assertEquals(relativePath({url: 'http://www.test.com/templates/../test.twig'}, 'myFile.twig'), 'http://www.test.com/myFile.twig');
        assertEquals(relativePath({path: 'test/templates/../test.twig'}, 'myFile.twig'), ('test/myFile.twig'));
    });

    await t.step('should respect relative directories', function () {
        assertEquals(relativePath({url: 'http://www.test.com/templates/./test.twig'}, 'myFile.twig'), 'http://www.test.com/templates/myFile.twig');
        assertEquals(relativePath({path: 'test/templates/./test.twig'}, 'myFile.twig'), ('test/templates/myFile.twig'));
    });

        
    await t.step('url -> should use the url if no base is specified', function () {
        assertEquals(relativePath({url: 'http://www.test.com/test.twig'}), 'http://www.test.com/');
    });

    await t.step('should use the base if base is specified', function () {
        assertEquals(relativePath({url: 'http://www.test.com/test.twig', base: 'myTest'}), 'myTest/');
    });
       
    await t.step('path -> should use the path if no base is specified', function () {
        assertEquals(relativePath({path: 'test/test.twig'}), ('test/'));
    });

    await t.step('should use the base if base is specified', function () {
        assertEquals(relativePath({path: 'test/test.twig', base: 'myTest'}), ('myTest/'));
    });
   
});
