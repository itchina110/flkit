<?php
include_once '../../stc/src/vender/Fl/src/Fl.class.php';
Fl::loadClass('Fl_Html_Token');
$content = file_get_contents('1.txt');
$instance = new Fl_Html_Token($content);
$start = microtime(true);
$instance->run();
$end = microtime(true);
echo ($end - $start) * 1000;