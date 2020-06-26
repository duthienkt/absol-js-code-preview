import ace from 'absol-brace/BraceExternal/FBrace';
import '../css/tripleeditor.css';
import Core from "./dom/Core";
import XHR from "absol/src/Network/XHR";

import 'brace/keybinding/emacs';
import 'brace/ext/searchbox';
import 'brace/mode/javascript';
import 'brace/mode/html';
import 'brace/mode/css';

import 'brace/ext/language_tools';
import 'brace/snippets/css';
import 'brace/snippets/javascript';
import 'brace/snippets/html';
import 'brace/ext/beautify';
import {randomIdent} from "absol/src/String/stringGenerate";
import Broadcast from "absol/src/Network/Broadcast";


var noneCacheHeader = {
    'cache-control': 'no-cache, must-revalidate, post-check=0, pre-check=0',
    'expires': 'max-age=0',
    'pragma': 'no-cache'
};

/***
 *
 * @param url
 * @return {Promise<String>}
 */
function downloadCode(url) {
    return XHR.request('get', url, {}, noneCacheHeader)
        .then(function (res) {
            return res;
        })
}

var $ = Core.$;
var _ = Core._;

function TripleEditor() {
    this.htmlEditor = null;
    this.cssEditor = null;
    this.jsEditor = null;
    this.$view = null;
    this.$htmlEditor = null;
    this.$cssEditor = null;
    this.$jsEditor = null;
    this.$runBtn = null;
    this.channel = randomIdent(10);
    this.broashcast = new Broadcast(this.channel, randomIdent(10));
    this.broashcast.on('GET_ALL', this.sendAllCode.bind(this));
    this.slaveUrl = './preview_slave.html';
}

TripleEditor.prototype.initRoot = function (elt) {
    var thisTE = this;
    this.$view = elt;

    this.$htmlEditor = _('pre').addTo(this.$view);
    this.htmlEditor = ace.edit(this.$htmlEditor);
    this.htmlEditor.setOptions({
        mode: 'ace/mode/html',
        enableBasicAutocompletion: true
    })

    this.$csslEditor = _('pre').addTo(this.$view);
    this.cssEditor = ace.edit(this.$csslEditor);
    this.cssEditor.setOptions({
        mode: 'ace/mode/css',
        enableBasicAutocompletion: true
    });

    this.$jsEditor = _('pre').addTo(this.$view);
    this.jsEditor = ace.edit(this.$jsEditor);
    this.jsEditor.setOptions({
        mode: 'ace/mode/javascript',
        enableBasicAutocompletion: true
    })

    this.$runBtn = _({
        tag: 'a',
        class: 'as-triple-editor-play-btn',
        props: {
            href: '#',
            title: 'Preview'
        },
        child: 'span.mdi.mdi-play',
        on: {
            click: this.runCode.bind(this)
        }
    }).addTo(this.$view);
    this.$runTrigger = _({
        tag: 'a',
        style: {
            display: 'none',
        },
        props: {
            href: this.slaveUrl + '?channel=' + this.channel,
            target: "_blank",
        }
    }).addTo(this.$view);

    ['html', 'css', 'js'].forEach(function (type) {
        _({
            class: 'as-triple-editor-' + type + '-note',
            child: { text: type }
        }).addTo(thisTE.$view);
    })
}

TripleEditor.prototype.runCode = function () {
    var thisTE = this;
    this.broashcast.emit("RELOAD", {});

    function finish() {
        clearTimeout(timeout);
        thisTE.broashcast.off("GET_ALL");
    }

    this.broashcast.on('GET_ALL', finish);
    var timeout = setTimeout(function () {
        thisTE.broashcast.off("GET_ALL", finish);
        thisTE.$runTrigger.click();
    }, 1000);
};

TripleEditor.prototype.loadHtml = function (src) {
    var thisTE = this;
    downloadCode(src).then(function (text) {
        thisTE.htmlEditor.setValue(text, -1);
    });
};

TripleEditor.prototype.loadCSS = function (src) {
    var thisTE = this;
    downloadCode(src).then(function (text) {
        thisTE.cssEditor.setValue(text, -1);
    });
};

TripleEditor.prototype.loadJS = function (src) {
    var thisTE = this;
    downloadCode(src).then(function (text) {
        thisTE.jsEditor.setValue(text, -1);
    });
};

TripleEditor.prototype.sendAllCode = function () {
    this.broashcast.emit('RECEIVE_ALL', {
        html: this.htmlEditor.getValue(),
        css: this.cssEditor.getValue(),
        js: this.jsEditor.getValue()
    })
};

TripleEditor.fromElt = function (elt) {
    var editor = new TripleEditor();
    editor.initRoot(elt);
    var htmlSrc = elt.getAttribute('data-html-src');
    if (htmlSrc) editor.loadHtml(htmlSrc);
    var cssSrc = elt.getAttribute('data-css-src');
    if (cssSrc) editor.loadCSS(cssSrc);
    var jsSrc = elt.getAttribute('data-js-src');
    if (jsSrc) editor.loadJS(jsSrc);
    var slaveUrl = elt.getAttribute('data-slave-url');
    if (slaveUrl)
        this.slaveUrl = slaveUrl;
    return editor;
};

TripleEditor.autoReplace = function () {
    var editors = [];
    var elts = document.getElementsByClassName('as-triple-editor');
    console.log(elts);
    for (var i = 0; i < elts.length; ++i) {
        editors.push(TripleEditor.fromElt(elts[i]));
    }

    return editors;
};

export default TripleEditor;