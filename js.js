const COIN_AMOUNT = 10;
const GRAPH_LIMIT = 5;
if (!localStorage.mode) {
    localStorage.mode = ""
}
if (!localStorage.selected_arr) {
    localStorage.selected_arr = "[]";
    selected_arr = [];
}
else {
    selected_arr = JSON.parse(localStorage.selected_arr);
}

if (!localStorage.moreInfo_arr) {
    localStorage.moreInfo_arr = "[]";
    moreInfo_arr = [];
}
else {
    moreInfo_arr = JSON.parse(localStorage.moreInfo_arr);
}
$(document).ready(function () {
    switch (localStorage.mode) {
        case "about":
            About();
            break;
        case "realtimereports":
            RealTimeReports();
            break;
        default: Currency();
    }
});
function About() {
    localStorage.mode = "about";
    $(".nav-item.active").removeClass("active");
    $("#about-link").addClass("active");
    $(".display").html("");
    $(".display").html("this is the about page");

}
function RealTimeReports() {
    localStorage.mode = "realtimereports";
    $(".nav-item.active").removeClass("active");
    $("#realtimereports-link").addClass("active");
    $(".display").html("");
    if (!selected_arr.length) {
        alert("No currencies selected. Please select at least one currency");
        Currency();
    }
    else {
        let _orgAjax = jQuery.ajaxSettings.xhr;
        jQuery.ajaxSettings.xhr = function () {
            let xhr = _orgAjax();
            xhr.onreadystatechange = function () {
                $(".display").html("");
                let progress = $(`<div class="progress" style="height: 20px; width: 50%">
      <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar"
       aria-valuenow="${xhr.readyState * 25}" aria-valuemin="0" aria-valuemax="100" style="width: ${xhr.readyState * 25}%"></div>
    </div>`);
                $(".display").append(progress);

            }
            return xhr;
        };

        $.ajax({
            url: "https://min-api.cryptocompare.com/data/pricemulti",
            type: "GET",
            data: {
                fsyms: selected_arr.toString().toUpperCase()
                , tsyms: "USD,EUR"
            },
            success: function (res) {
                $(".display").html("");
                console.log(res);
                if (res["Response"] == "Error") {


                    console.log("Error:", res);
                    alert("Error " + res.responseText);

                }
                createGraph(res);


            },
            error: function (xhra) {

                console.log("Error:", xhra);
                alert("Error " + xhra.responseText);
            }
        });
    }

}

function Currency() {
    localStorage.mode = "currency";
    $(".nav-item.active").removeClass("active");
    $("#currency-link").addClass("active");
    $(".display").html("");

    $.ajax({
        url: "https://api.coingecko.com/api/v3/coins/list",
        type: "GET",
        data: {},
        success: function (res) {
            let delay = setTimeout(() => {
                $(".display").html("");
                console.log(res);
                createCurrencyArray(res.slice(0, COIN_AMOUNT - 1));
            }, 750);

        },
        error: function (xhr) {
            $(".display").html("");
            console.log("Error:", xhr);
            alert("Error " + xhr.responseText);
        }
    });

}

function createCurrencyArray(res) {
    curr = res;
    let search_bar = $(`<input type="text" id="search-bar" placeholder="Search..">`);
    let search_btn = $(`<btn class="btn btn-success" id="search-btn">Search</btn>`);
    let card_wrapper = $(`<div class="card-wrapper row"></div>`);
    $(`.display`).append(search_bar).append(search_btn).append(card_wrapper);
    $(search_btn).click(function (){
        filterResults();
    })
    
    for (let i = 0; i < curr.length; i++) {
        let id = res[i].id;
        let no = findId(id);
        createCard(res[i],no);
        if (no > -1) {
            moreInfo_arr.splice(no, 1);
            moreInfoToggle(id);
        }

        if (selected_arr.indexOf(res[i]["symbol"]) > -1) {
            $(`#cb-${id}`)[0].checked = true;
            selected_arr.splice(selected_arr.indexOf(res[i]["symbol"]), 1);
            clickSelect(id, res[i]);
        }

        $(`#cb-${id}`).click(function () {
            clickSelect(id, res[i]);


        })

        $(`#info-btn-${id}`).click(function () {
            moreInfoToggle(id);
        })


    }
}

function moreInfo(id) {
    let _orgAjax = jQuery.ajaxSettings.xhr;
    jQuery.ajaxSettings.xhr = function () {
        let xhr = _orgAjax();
        xhr.onreadystatechange = function () {
            $(`#more-info-${id}`).html("");
            let progress = $(`<div class="progress" style="height: 10px; width: 100%">
      <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar"
       aria-valuenow="${xhr.readyState * 25}" aria-valuemin="0" aria-valuemax="100" style="width: ${xhr.readyState * 25}%"></div>
    </div>`);
            $(`#more-info-${id}`).append(progress);

        }
        return xhr;
    };
    $.ajax({
        url: `https://api.coingecko.com/api/v3/coins/${id}`,
        type: "GET",
        data: {},
        success: function (res) {
            let delay = setTimeout(() => {
                console.log(res);
                $(`#more-info-${id}`).html("");
                moreInfoCard(res);
            }, 750);


        },
        error: function (xhr) {
            console.log("Error:", xhr);
            $(`#more-info-${id}`).html("");
            alert("Error " + xhr.responseText);
        }
    });
}

function moreInfoCard(res) {
    moreInfoCardAppend(res);


    moreInfo_arr.push({
        id: res["id"],
        image: { large: res["image"]["large"] },
        market_data: {
            current_price: {
                usd: res.market_data.current_price.usd,
                eur: res.market_data.current_price.eur,
                ils: res.market_data.current_price.ils
            }
        }
        ,
        timer: false,
        status: true
    });
    localStorage.moreInfo_arr = JSON.stringify(moreInfo_arr);
}

function moreInfoToggle(id) {

    $(`#info-btn-${id}`).attr('active', function (index, attr) {
        return attr == "false" ? "true" : "false";
    });
    let date = new Date();

    if ($(`#info-btn-${id}`).attr('active') == "false") {
        $(`#more-info-${id}`).html("");
        
        $(moreInfo_arr).each(function (index, curr) {
            if (curr.id == id) {
                curr.status = false;
                
                if (!curr.timer) {
                    
                    curr.timer = date.getTime();
                    localStorage.moreInfo_arr = JSON.stringify(moreInfo_arr);
                }
                
            }
        })
    

    }
    else {
        let flag = true;
        $(moreInfo_arr).each(function (index, curr) {
            if ((curr.id == id)&&(curr.timer > date.getTime()-(2000*60))) {
                
                moreInfoCardAppend(curr);
                curr.status = true;
                flag = false;
            }
        })
        if (flag) {
            moreInfo(id);
        }
    }

}
function clickSelect(id, res) {
    let mainParent = $(`#cb-${id}`).parent('.toggle-btn');
    if (document.getElementById(`cb-${id}`).checked) {
        if ((selected_arr.length == 5)) {
            openRestrictionModal();
        }
        else{
        $(mainParent).addClass('active');
        selected_arr.push(res["symbol"]);
        localStorage.selected_arr = JSON.stringify(selected_arr);
        console.log(selected_arr);
        }

        
    } else {
        $(mainParent).removeClass('active');
        selected_arr.splice(selected_arr.indexOf(res["symbol"]), 1);
        localStorage.selected_arr = JSON.stringify(selected_arr);
        console.log(selected_arr);

    }
}

function PopupClickSelect(id, symbol) {
    console.log("symbol" + symbol)
    let mainParent = $(`#popup-cb-${id}`).parent('.toggle-btn');
    if (document.getElementById(`popup-cb-${id}`).checked) {
        $(mainParent).addClass('active');
        popselected_arr.push(symbol);
        
        console.log(popselected_arr);

       
    } else {
        $(mainParent).removeClass('active');
        popselected_arr.splice(selected_arr.indexOf(symbol), 1);
        
        console.log(popselected_arr);

    }
}

function openRestrictionModal() {
    popselected_arr = [...selected_arr];
    console.log(popselected_arr);
let modal = $(`.popup`);
let cover =  $(`.cover`);
let card_wrapper = $(`.modal-body`);
card_wrapper.addClass("row");
for(let i=0;i<selected_arr.length;i++){
    let card = $(`<div class="card col-md-4" id="popup-card-${selected_arr[i]}" style="width: 18rem;">
    <div class="card-body">
      <h5 class="card-title">${selected_arr[i]}</h5>
      
      <div class="toggle-btn active">
  <input type="checkbox" class="cb-value" id="popup-cb-${selected_arr[i]}" />
  <span class="round-btn"></span>
</div>
</div>
    </div>
  </div>`);
  card_wrapper.append(card);
  document.getElementById(`popup-cb-${selected_arr[i]}`).checked =true;
  $(`#popup-cb-${selected_arr[i]}`).on('click',function () {
    PopupClickSelect(selected_arr[i], selected_arr[i]);


});
  
}
$(modal).css({display: "block"});
$(cover).css({display: "block"});
$(`#popup-cancel-btn`).click(function(){
    
    modal.css({display: "none"});
    cover.css({display: "none"});
    card_wrapper.html="";

})
$(`.close`).click(function(){
    
    modal.css({display: "none"});
    cover.css({display: "none"});
    card_wrapper.html="";


})
$(`#popup-save-changes-btn`).click(function(){
    selected_arr = [...popselected_arr];
    $("display").html="";
    modal.css({display: "none"});
    cover.css({display: "none"});
    createCurrencyArray(curr);
    

})
console.log(modal);

$(`.display`).append(modal);
modal.css({display: "block"});
}

function filterResults(){
    
}

function moreInfoCardAppend(res) {
    let card = $(`<div class="card" style="width: 18rem;">
    <div class="row no-gutters">
    <div class="col-md-4">
  <img src="${res["image"]["large"]}" class="card-img-top" alt="...">
  </div>
  <div class="col-md-8">
  <div class="card-body">
    <p class="card-text">
    <label>Price in USD: $${res.market_data.current_price.usd}</label>
    <label>Price in EUR: ${res.market_data.current_price.eur}€</label>
    <label>Price in NIS: ₪${res.market_data.current_price.ils}</label>
    </p>
  </div>
  </div>
  </div>
  </div>`);
    $(`#more-info-${res["id"]}`).html("");
    $(`#more-info-${res["id"]}`).append($(card));
}

function findId(id) {
    let flag = -1;
    $(moreInfo_arr).each(function (index, curr) {
        if ((curr.id == id) && curr.status) {
            flag = index;
        }
    })
    return flag;
}






function createGraph(res) {
    colors = ["red", "blue", "green", "black", "grey"];
    dataPoints = [];
    for(let i=0;i<GRAPH_LIMIT;i++){
        dataPoints.push([]);
    }
    
    var chart = new CanvasJS.Chart("display", {
        title: {
            text: "Comparing Currency"
        },
        axisY: [{
            title: "Value in USD",
            lineColor: "#C24642",
            tickColor: "#C24642",
            labelFontColor: "#C24642",
            titleFontColor: "#C24642",
            prefix: "$"
        },
        ],
        axisY2: {
            title: "Value in EUR",
            lineColor: "#7F6084",
            tickColor: "#7F6084",
            labelFontColor: "#7F6084",
            titleFontColor: "#7F6084",
            prefix: "$",
        },
        toolTip: {
            shared: true
        },
        legend: {
            cursor: "pointer",
            itemclick: toggleDataSeries
        },
        data: []
    });
   
    let i = 0;
    let date = new Date();
    date.setHours(date.getHours()<10? `0${date.getHours()}`:date.getHours() ,date.getMinutes()<10? `0${date.getMinutes()}`:date.getMinutes(), date.getSeconds()<10? `0${date.getSeconds()}`:date.getSeconds());
    
    
    $.each(res,function (key, value) {
    
        console.log("key: "+ key + ", value:"+ JSON.stringify(value));
        // let a =`${date.getHours()<10? `0${date.getHours()}`:date.getHours()}:${date.getMinutes()<10? `0${date.getMinutes()}`:date.getMinutes()}:${date.getSeconds()<10? `0${date.getSeconds()}`:date.getSeconds()}`;
        
        dataPoints[i].push({ x: date, y: value["USD"] });
        
        console.log(dataPoints);
        chart.options.data.push(
            {
                type: "line",
                name: key.toString(),
                color: colors[i],
                axisYType: "secondary",
                showInLegend: true,
                dataPoints: 
                    dataPoints[i]
                
            }
        );
       
        i++;
    });

    chart.render();


    updateGraph(res, chart);



}

function toggleDataSeries(e) {
    if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
        e.dataSeries.visible = false;
    } else {
        e.dataSeries.visible = true;
    }
    e.chart.render();
}

function graphData(chart) {
    let _orgAjax = jQuery.ajaxSettings.xhr;
    jQuery.ajaxSettings.xhr = function () {
        let xhr = _orgAjax();
        xhr.onreadystatechange = function () {
           

        }
        return xhr;
    }
    $.ajax({
        url: "https://min-api.cryptocompare.com/data/pricemulti",
        type: "GET",
        data: {
            fsyms: selected_arr.toString().toUpperCase()
            , tsyms: "USD,EUR"
        },
        success: function (res) {
            
            console.log(res);
            if (res["Response"] == "Error") {


                console.log("Error:", res);
                alert("Error " + res.responseText);

            }
            if (localStorage.mode == "realtimereports") {
                let delay = setTimeout(() => {
                    updateGraph(res, chart);
                }, 2000);
            }



        },
        error: function (xhra) {

            console.log("Error:", xhra);
            alert("Error " + xhra.responseText);
        }
    });
}


function updateGraph(res, chart) {
    console.log(chart.options)
    let i = 0;
    let date = new Date();
    date.setHours(date.getHours()<10? `0${date.getHours()}`:date.getHours() ,date.getMinutes()<10? `0${date.getMinutes()}`:date.getMinutes(), date.getSeconds()<10? `0${date.getSeconds()}`:date.getSeconds());
    $.each(res,function (key, value) {
        dataPoints[i].push({ x: date, y: value["USD"] });
        chart.options.data[i]["dataPoints"] = dataPoints[i];
        i++;
    });
    chart.render();
    console.log(chart)

    graphData(chart);
}

function createCard(coin,no){
    let id = coin.id;
    let card = $(`<div class="card col-md-4" id="card-${id}" style="width: 18rem;">
    <div class="card-body">
      <h5 class="card-title">${coin["symbol"]}</h5>
      <h6 class="card-subtitle mb-2 text-muted">${coin["name"]}</h6>
      <div class="toggle-btn">
  <input type="checkbox" class="cb-value" id="cb-${id}" />
  <span class="round-btn"></span>
</div>
<button class="btn btn-primary" active=
      "false"
       id="info-btn-${id}" type="button" data-toggle="collapse" data-target="#collapseExample-${coin["id"]}" aria-expanded="false" aria-controls="collapseExample">
More info
</button>
</p>
<div class="collapse ${no > -1 ? "show" : ""}" id="collapseExample-${id}">
<div class="card card-body" id="more-info-${id}">

</div>
</div>
    </div>
  </div>`);
        $(".card-wrapper").append(card);
}