<?php
require_once '/Users/welefen/Develop/git/stc/src/vender/Fl/src/Fl.class.php';
Fl::loadClass('Fl_Css_Token');
$content = file_get_contents('page.css');
$startTime = microtime(true);
$instance = new Fl_Css_Token($content);
$instance->run();
$endTime = microtime(true);
echo ($endTime - $startTime) * 1000 . "\n";