<?php
require_once '/Users/welefen/Develop/git/stc/src/vender/Fl/src/Fl.class.php';
Fl::loadClass('Fl_Html_Token');
$content = file_get_contents('page.html');
$startTime = microtime(true);
$instance = new Fl_Html_Token($content);
$instance->run();
$endTime = microtime(true);
echo ($endTime - $startTime) * 1000 . "\n";