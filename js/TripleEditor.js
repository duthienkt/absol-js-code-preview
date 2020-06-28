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
import Fragment from "absol/src/AppPattern/Fragment";


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
    this.slaveUrl = './preview_slave.html';
    this.$elt = null;
    this.editorHolders = {};
    this.editorFlags = [1, 1, 1];
}

Object.defineProperties(TripleEditor.prototype, Object.getOwnPropertyDescriptors(Fragment.prototype));
TripleEditor.prototype.constructor = TripleEditor;


TripleEditor.prototype.createView = function () {
    this.broashcast = new Broadcast(this.channel, randomIdent(10));
    this.broashcast.on('GET_ALL', this.sendAllCode.bind(this));

    this.$view = _({
        elt: this.$elt,
        child: [
            {
                class: 'as-triple-editor-ctn',
                child: [
                    {
                        tag: 'pre',
                        class: 'as-triple-editor-html',
                    },
                    {
                        class: 'as-triple-editor-language-note',
                        child: { text: 'html' }
                    }
                ]
            },
            {
                class: 'as-triple-editor-ctn',
                child: [
                    {
                        tag: 'pre',
                        class: 'as-triple-editor-css'
                    },
                    {
                        class: 'as-triple-editor-language-note',
                        child: { text: 'css' }
                    }
                ]
            },
            {
                class: 'as-triple-editor-ctn',
                child: [
                    {
                        tag: 'pre',
                        class: 'as-triple-editor-js'
                    },
                    {
                        class: 'as-triple-editor-language-note',
                        child: { text: 'js' }
                    }
                ]
            },
            {
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
            },
            {
                tag: 'a',
                class: 'as-triple-editor-run-trigger',
                style: {
                    display: 'none',
                },
                props: {
                    href: this.slaveUrl + '?channel=' + this.channel,
                    target: "_blank",
                }
            }
        ]
    });

    this.$runTrigger = $('.as-triple-editor-run-trigger', this.$view);

    this.$htmlEditor = $('.as-triple-editor-html', this.$view);
    this.htmlEditor = ace.edit(this.$htmlEditor);
    this.htmlEditor.setOptions({
        mode: 'ace/mode/html',
        enableBasicAutocompletion: true
    });
    this.$cssEditor = $('.as-triple-editor-css', this.$view);
    this.cssEditor = ace.edit(this.$cssEditor);
    this.cssEditor.setOptions({
        mode: 'ace/mode/css',
        enableBasicAutocompletion: true
    });
    this.$jsEditor = $('.as-triple-editor-js', this.$view);
    this.jsEditor = ace.edit(this.$jsEditor);
    this.jsEditor.setOptions({
        mode: 'ace/mode/javascript',
        enableBasicAutocompletion: true
    })
    this.$ctns = [this.$htmlEditor.parentElement, this.$cssEditor.parentElement, this.$jsEditor.parentElement];
    this.updateCtnSizeByFlag();
};

TripleEditor.prototype.updateCtnSizeByFlag = function () {
    var count = this.editorFlags[0] + this.editorFlags[1] + this.editorFlags[2];
    this.$view.addStyle('--editor-width', 100 / count + '%');
    var s = 0;
    for (var i = 0; i < 3; ++i) {
        this.$ctns[i].addStyle('left', 100 / count * s + '%');
        if (this.editorFlags[i] === 0) {
            this.$ctns[i].addClass('as-hidden');
        }
        else {
            this.$ctns[i].removeClass('as-hidden');
            s += 1;
        }
    }
};


TripleEditor.prototype.initRoot = function (elt) {
    this.$elt = elt;
    this.getView();
};

TripleEditor.prototype.runCode = function () {
    var thisTE = this;
    this.broashcast.emit("RELOAD", {});

    function finish() {
        clearTimeout(timeout);
        thisTE.broashcast.off("RELOADED");
    }

    this.broashcast.on('RELOADED', finish);
    var timeout = setTimeout(function () {
        thisTE.broashcast.off("RELOADED", finish);
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
    var htmlSrc = elt.getAttribute('data-html-src');
    if (htmlSrc) editor.loadHtml(htmlSrc);
    var cssSrc = elt.getAttribute('data-css-src');
    if (cssSrc) editor.loadCSS(cssSrc);
    var jsSrc = elt.getAttribute('data-js-src');
    if (jsSrc) editor.loadJS(jsSrc);
    var slaveUrl = elt.getAttribute('data-slave-url');
    if (slaveUrl)
        editor.slaveUrl = slaveUrl;
    var channel = elt.getAttribute('data-channel');
    if (channel)
        editor.channel = channel;
    var editorFlag = (elt.getAttribute('data-editor-flag') || '0 0 0').split(/\s+/)
        .map(function (v) {
            return parseInt(v);
        });
    editor.editorFlags = editorFlag;
    editor.initRoot(elt);
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