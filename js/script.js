$(function () {
    // <img src="image/services/${pageName}.png" alt="Avatar" style="width:50%">

    //on ready hide all forms
    $('.fa-home').click(function () {
        $('.input-form').empty();
        $('.result-div').empty();
        $('.homepage-items').show();
    });

    createHomePageItems('wp1c', 10, 0);
    createHomePageItems('wp2c', 20, 10);

    $('.card').click(function () {
        $('.homepage-items').hide();
        var cardName = $(this).attr('id');
        $('.input-form').load('forms/' + cardName + '.html');
    });
});
var icons = [
    'eercast', 'wpexplorer', 'address-book-o', 'free-code-camp',
    'telegram', 'user-circle-o', 'wpexplorer', 'podcast', 'snowflake-o',
    'microchip', 'ravelry', 'linode', 'balance-scale', 'bomb', 'building',
    'car', 'cloud', 'database', 'feed (alias)', 'globe', 'institution (alias)', 
    'buysellads', 'empire', 'google-wallet','yelp','heartbeat','files-o',
    'th','btc','ils'
];

function createHomePageItems(apiName, itemCount, lastIconIndex) {
    //Create WP1 items
    for (var i = 1; i <= itemCount; i++) {
        var pageName = i < 10 ? apiName + '0' + i : apiName + i;
        $('.homepage-items').append(
            `<div class="card" id=${pageName}>
                <i class="fa fa-${icons[lastIconIndex+ (i-1)]} fa-5x" aria-hidden="true"></i>
                <div class="container">
                    <h4><b>${pageName}</b></h4>
                </div>
            </div>`
        );
    }
}