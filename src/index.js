let $ = require("jquery");

import { Api, JsonRpc, RpcError } from 'eosjs';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';

let PageOverlay = require("./pageoverlay");
var pageoverlay;


var rpc = new JsonRpc('https://chain.wax.io');
var api;
var signatureProvider;


let CONTRACT = 'waxbadgesftw';


async function pushContractAction(contractFunction, data, callback) {
    showLog();
    writeLogCommand("push action waxbadgesftw " + contractFunction);
    showLoading();

    console.log(contractFunction);
    console.log(data);

    try {
        const result = await api.transact(
            {
                actions: [{
                    account: CONTRACT,
                    name: contractFunction,
                    authorization: [{
                        actor: ACCOUNT_NAME,
                        permission: 'active',
                    }],
                    data: data,
                }]
            },
            {
                blocksBehind: 3,
                expireSeconds: 30,
            }
        );
        hideLoading();
        writeLog(JSON.stringify(result, null, 2) + "\n");
        callback(result);

    } catch(e) {
        writeLogError(e);
        hideLoading();
    }
}


async function renderIndex() {
    console.log(ACCOUNT_NAME);

    (async() => {
        writeLogCommand("get table " + CONTRACT + " ecosystems");
        const resp = await rpc.get_table_rows({
            json: true,              // Get the response as json
            code: CONTRACT,    // Contract that we target
            scope: CONTRACT,     // Account that owns the data
            table: 'ecosystems',     // Table name
            index_position: 2,           // Table secondary key index
            key_type: 'i64',             // Secondary index type
            lower_bound: ACCOUNT_NAME,   // Table secondary key value
            upper_bound: ACCOUNT_NAME,   // Table secondary key value
            limit: 10,               // Maximum number of rows that we want to get
        });

        writeLog(JSON.stringify(resp.rows, null, 2));

        $("#page_index .ecosystems_list").empty();

        if (resp.rows.length == 0) {
            $(".ecosystems_container .section_note").show();
        } else {
            $(".ecosystems_container .section_note").hide();
            for(var i=0; i < resp.rows.length; i++) {
                var ecosystem = resp.rows[i];
                $("#page_index .ecosystems_list").append("<div id='ecosys_entry_" + ecosystem.key + "'><a href='/ecosys/" + ecosystem.key + "'>" + ecosystem.name + "</a>&nbsp;&nbsp;&nbsp;<span class='stylized_button stylized_button_tiny' id='edit_ecosys_" + ecosystem.key + "'>edit</span></div>");
                if (i == resp.rows.length - 1) {
                    $("#ecosys_entry_" + ecosystem.key).append("&nbsp;|&nbsp;<span class='stylized_button stylized_button_tiny' id='rm_ecosys_" + ecosystem.key + "'>delete</span>");
                }
                // Wire up its edit click
                $("#edit_ecosys_" + ecosystem.key).unbind();
                $("#edit_ecosys_" + ecosystem.key).click(function() {
                    $("#add_ecosys_dialog_action").text("Edit");
                    $("#add_ecosys_ecosystem_id").val(ecosystem.key);
                    $("#add_ecosys_name").val(ecosystem.name);
                    $("#add_ecosys_description").val(ecosystem.description);
                    $("#add_ecosys_website").val(ecosystem.website);
                    $("#add_ecosys_assetbaseurl").val(ecosystem.assetbaseurl);
                    $("#add_ecosys_logoassetname").val(ecosystem.logoassetname);
                    $("#add_ecosys_submit_button").text("save changes");
                    pageoverlay.showPageOverlay($("#add_ecosys_container"));
                });

                // Wire up its delete click
                $("#rm_ecosys_" + ecosystem.key).unbind();
                $("#rm_ecosys_" + ecosystem.key).click(function() {
                    if (confirm("Are you sure you want to delete the \"" + ecosystem.name + "\" Ecosystem?")) {
                        let contractFunction = "rmecosys";
                        let data = {
                            ecosystem_owner: ACCOUNT_NAME,
                            ecosystem_id: ecosystem.key
                        }

                        pushContractAction(contractFunction, data, (result) => {
                            console.log(result);
                            setTimeout(() => {
                                    renderIndex();
                                },
                                1000
                            );
                        });
                    }
                });

            }
        }

        hideLoading();
    })();

    pageoverlay.initPageOverlay($("#add_ecosys_container"));
    $("#add_ecosys_button").unbind();
    $("#add_ecosys_button").click(function() {
        $("#add_ecosys_dialog_action").text("Add");
        $("#add_ecosys_name").val("");
        $("#add_ecosys_description").val("");
        $("#add_ecosys_website").val("");
        $("#add_ecosys_assetbaseurl").val("");
        $("#add_ecosys_logoassetname").val("");
        $("#add_ecosys_submit_button").text("create ecosystem");
        pageoverlay.showPageOverlay($("#add_ecosys_container"));
    });

    $("#add_ecosys_submit_button").unbind();
    $("#add_ecosys_submit_button").click(function() {
        let name = $("#add_ecosys_name").val();
        let description = $("#add_ecosys_description").val();
        let website = $("#add_ecosys_website").val();
        let assetbaseurl = $("#add_ecosys_assetbaseurl").val();
        let logoassetname = $("#add_ecosys_logoassetname").val();

        if (name == "") {
            alert("ecosystem name is required!");
            return;
        }
        if (website != "" && (!website.startsWith('http://') && !website.startsWith('https://'))) {
            alert("website should begin with 'http' or 'https'");
            return;
        }
        if (website == "" && assetbaseurl != "") {
            alert("website is required if assetbaseurl is specified!");
            return;
        }

        let contractFunction = "addecosys";
        let data = {
            ecosystem_owner: ACCOUNT_NAME,
            ecosystem_name: name,
            description: description,
            website: website,
            assetbaseurl: assetbaseurl,
            logoassetname: logoassetname
        }
        if ($("#add_ecosys_dialog_action").text() == "Edit") {
            contractFunction = "editecosys";
            data["ecosystem_id"] = $("#add_ecosys_ecosystem_id").val();
        }

        pageoverlay.hidePageOverlay($("#add_ecosys_container"));

        pushContractAction(contractFunction, data, (result) => {
            console.log(result);
            setTimeout(() => {
                    renderIndex();
                },
                1000
            );
        });
    });

    $("#page_index").show();
}




async function renderEcosys(key) {
    const resp = await rpc.get_table_rows({
        json: true,              // Get the response as json
        code: CONTRACT,     // Contract that we target
        scope: CONTRACT,         // Account that owns the data
        table: 'ecosystems',        // Table name
        lower_bound: key,
        upper_bound: key,
        limit: 1,               // Maximum number of rows that we want to get
    });

    writeLog(JSON.stringify(resp.rows, null, 2));
    console.log(resp.rows);

    if (resp.rows.length == 0) {
        window.location.href = "/";
        return;
    }

    var ecosystem = resp.rows[0];
    $(".page_title").text(ecosystem.name);
    $("#ecosystem_website").append("<a href='" + ecosystem.website + "' target='_new'>" + ecosystem.website + "</a>");
    $("#ecosystem_description").text(ecosystem.description);

    $("#page_ecosys").find(".categories_list").empty();

    if (ecosystem.categories.length == 0) {
        $(".categories_container .section_note").show();
    } else {
        $(".categories_container .section_note").hide();

        for (var i=0; i < ecosystem.categories.length; i++) {
            let category = ecosystem.categories[i];
            category.key = i;

            $("#page_ecosys").find(".categories_list").append("<div id='cat_entry_" + category.key + "' class='item_row'>" + category.name + "&nbsp;&nbsp;&nbsp;<span class='stylized_button stylized_button_tiny' id='edit_category_" + i + "'>edit</span></div>");
            if (i == ecosystem.categories.length - 1) {
                $("#cat_entry_" + category.key).append("&nbsp;&nbsp;|&nbsp;&nbsp;<span class='stylized_button stylized_button_tiny' id='rmlast_category_" + category.key + "'>delete</span>");
            }
            if (i % 2 == 1) {
                $("#cat_entry_" + category.key).addClass("alt_row");
            }

            // Wire up its edit click
            $("#edit_category_" + category.key).unbind();
            $("#edit_category_" + category.key).click(function() {
                $("#add_category_dialog_action").text("Edit");
                $("#add_category_category_id").val(category.key);
                $("#add_category_name").val(category.name);
                $("#add_category_submit_button").text("save changes");
                pageoverlay.showPageOverlay($("#add_category_container"));
            });

            // Wire up its rmlast_category click
            $("#rmlast_category_" + category.key).unbind();
            $("#rmlast_category_" + category.key).click(function() {
                if (confirm("Are you sure you want to delete the \"" + category.name + "\" Category?")) {
                    let contractFunction = "rmlastcat";
                    let data = {
                        ecosystem_owner: ACCOUNT_NAME,
                        ecosystem_id: ecosystem.key
                    }

                    pushContractAction(contractFunction, data, (result) => {
                        console.log(result);
                        setTimeout(() => {
                                renderEcosys(ecosystem.key);
                            },
                            1000
                        );
                    });

                }
            });

            $("#cat_entry_" + category.key).append("<div class='achievements_list' id='cat_" + category.key + "_achivements_list'></div>");

            for (var j=0; j < category.achievements.length; j++) {
                let achievement = category.achievements[j];
                achievement.key = j;
                let is_deleteable = (achievement.usersgranted.length == 0);

                let $ach_template = $("<div id='cat_" + category.key + "_ach_" + achievement.key + "' class='achievement_entry'></div>")
                $("#cat_" + category.key + "_achivements_list").append($ach_template);

                let $action_div = $("<div class='ach_actions'></div>");
                $action_div.append("<span class='stylized_button stylized_button_tiny' id='grant_cat_" + category.key + "_ach_" + achievement.key + "'>grant</span>");
                $action_div.append("&nbsp;&nbsp;|&nbsp;&nbsp;<span class='stylized_button stylized_button_tiny' id='edit_cat_" + category.key + "_ach_" + achievement.key + "'>edit</span>");
                if (is_deleteable)
                    $action_div.append("&nbsp;&nbsp;|&nbsp;&nbsp;<span class='stylized_button stylized_button_tiny' id='delete_cat_" + category.key + "_ach_" + achievement.key + "'>delete</span>");
                $ach_template.append($action_div);

                let img_src = achievement.assetname;
                if (!img_src.includes('http://') && !img_src.includes('https://')) {
                    img_src = "//" + ecosystem.assetbaseurl + "/" + img_src;
                }
                $ach_template.append("<img class='ach_asset' src='" + img_src + "' />")

                $ach_template.append("<span class='ach_name'>" + achievement.name + "</span>");
                $ach_template.append("<div class='ach_description'>" + achievement.description + "</div>");

                if (achievement.maxquantity != "0") {
                    $ach_template.find(".ach_quantity").text("max: " + achievement.maxquantity);
                } else {
                    $ach_template.find(".ach_quantity").text("unlimited");
                }
                $ach_template.append("<div class='clearfix'></div>");


                // Wire up its edit click
                $("#edit_cat_" + category.key + "_ach_" + achievement.key).unbind();
                $("#edit_cat_" + category.key + "_ach_" + achievement.key).click(function() {
                    $("#add_achievement_dialog_action").text("Edit");
                    $("#add_achievement_category_id").val(category.key);
                    $("#add_achievement_achievement_id").val(achievement.key);
                    $("#add_achievement_name").val(achievement.name);
                    $("#add_achievement_description").val(achievement.description);
                    $("#add_achievement_assetname").val(achievement.assetname);
                    $("#add_achievement_maxquantity").val(achievement.maxquantity);
                    $("#add_achievement_submit_button").text("save changes");
                    pageoverlay.showPageOverlay($("#add_achievement_container"));
                });

            }

            $("#cat_" + category.key + "_achivements_list").append("<span class='stylized_button' id='cat_" + category.key + "_addach'>add achievement</span>");

            // wire up the add achievement click
            $("#cat_" + category.key + "_addach").unbind();
            $("#cat_" + category.key + "_addach").click(function() {
                $("#add_achievement_category_id").val(category.key);
                $("#add_achievement_dialog_action").text("Add");
                $("#add_achievement_achievement_id").val("");
                $("#add_achievement_name").val("");
                $("#add_achievement_description").val("");
                $("#add_achievement_assetname").val("");
                $("#add_achievement_maxquantity").val("");
                $("#add_achievement_submit_button").text("add achievement");
                pageoverlay.showPageOverlay($("#add_achievement_container"));
            });
        }
    }
    
    pageoverlay.initPageOverlay($("#add_achievement_container"));
    $("#add_achievement_submit_button").unbind();
    $("#add_achievement_submit_button").click(function() {
        let category_id = $("#add_achievement_category_id").val();
        let name = $("#add_achievement_name").val();
        let description = $("#add_achievement_description").val();
        let assetname = $("#add_achievement_assetname").val();
        let maxquantity = $("#add_achievement_maxquantity").val();

        if (name == "") {
            alert("category name is required!");
            return;
        }

        let contractFunction = "addach";
        let data = {
            ecosystem_owner: ACCOUNT_NAME,
            ecosystem_id: ecosystem.key,
            category_id: category_id,
            achievement_name: name,
            description: description,
            assetname: assetname,
            maxquantity: maxquantity
        }
        if ($("#add_achievement_dialog_action").text() == "Edit") {
            contractFunction = "editach";
            data["achievement_id"] = parseInt($("#add_achievement_achievement_id").val());
        }

        pageoverlay.hidePageOverlay($("#add_achievement_container"));

        pushContractAction(contractFunction, data, (result) => {
            console.log(result);
            setTimeout(() => {
                    renderEcosys(ecosystem.key);
                },
                1000
            );
        });
    });


    pageoverlay.initPageOverlay($("#add_category_container"));
    $("#add_category_button").unbind();
    $("#add_category_button").click(function() {
        $("#add_category_dialog_action").text("Add");
        $("#add_category_name").val("");
        $("#add_category_submit_button").text("add category");
        pageoverlay.showPageOverlay($("#add_category_container"));
    });


    $("#add_category_submit_button").unbind();
    $("#add_category_submit_button").click(function() {
        let name = $("#add_category_name").val();

        if (name == "") {
            alert("category name is required!");
            return;
        }

        let contractFunction = "addcat";
        let data = {
            ecosystem_id: ecosystem.key,
            ecosystem_owner: ACCOUNT_NAME,
            category_name: name,
        }
        if ($("#add_category_dialog_action").text() == "Edit") {
            contractFunction = "editcat";
            data["category_id"] = parseInt($("#add_category_category_id").val());
        }

        pageoverlay.hidePageOverlay($("#add_category_container"));

        pushContractAction(contractFunction, data, (result) => {
            console.log(result);
            setTimeout(() => {
                    renderEcosys(ecosystem.key);
                },
                1000
            );
        });
    });


    hideLoading();
    $("#page_ecosys").show();
}



function showLog() {
    let offset = $("#hide_log_button").outerHeight() + 20;

    $("#log_stream").css({height: window.innerHeight/2 - offset});
    $("#log_container").animate(
        {
            height: window.innerHeight/2
        },
        250,
        function() {}
    );
}
function hideLog() {
    $("#log_container").animate(
        {
            height: 0
        },
        250,
        function() {}
    );

}
function writeLog(output) {
    $("#log_stream").append(output + "\n");
    $("#log_stream").animate({ scrollTop: $("#log_stream").prop("scrollHeight")}, 125);
}
function writeLogError(output) {
    writeLog("<span class='error'>" + output + "</span>");
}
function writeLogCommand(output) {
    writeLog("<span class='command'>" + output + "</span>");
}



function showLoading() {
    $("#loading_overlay").show();

    var top_position = (window.innerHeight/2) - $("#loading_container").height();
    if (top_position < 20) { top_position = 20; }
    $("#loading_container").css({
        "position": "relative",
        "display": "block",
        "top": top_position,
    });

    $("#loading_container").animate({opacity:1.0}, 500);
}
function hideLoading() {
    $("#loading_overlay").hide();
    $("#loading_container").css({opacity:0.0});
}



$(document).ready(function() {

    showLoading();

    signatureProvider = new JsSignatureProvider([PRIVATE_KEY]);
    api = new Api({ rpc, signatureProvider });

    $(".account_name").text(ACCOUNT_NAME);



    pageoverlay = new PageOverlay();
    $("#page_overlay_popup_cancel_button").click(function(){
        // Wire up the popup cancel button
        pageoverlay.hidePageOverlay();
    });

    $(document).keyup(function(e) {
        // Dismiss popup with ESC button
        if (e.keyCode == 27) {
            if ($("#page_overlay").is(":visible")) {
                pageoverlay.hidePageOverlay();
            }
        }

        hideLog();
    });

    $(document).mouseup(function (e) {
        // Dismiss popup with click outside window
        var container = $("#page_overlay_popup");
        if (container.is(":visible") && 
            !container.is(e.target) // if the target of the click isn't the container...
            && container.has(e.target).length === 0) // ... nor a descendant of the container
        {
            pageoverlay.hidePageOverlay();
        }

        container = $("#log_container");
        if (container.is(":visible") && 
            !container.is(e.target) // if the target of the click isn't the container...
            && container.has(e.target).length === 0) // ... nor a descendant of the container
        {
            hideLog();
        }
    });


    $("#show_log_button").click(function(){ showLog(); });
    $("#hide_log_button").click(function(){ hideLog(); });



    let pathParts = window.location.pathname.split('/', 3);
    let page = pathParts[1];
    var param;
    if (page != "") {
        param = parseInt(pathParts[2]);
    }
    if (page == 'ecosys') {
        renderEcosys(param);
    } else {
        renderIndex();
    }


});



