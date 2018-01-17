var ERouletteColor = Object.freeze({
    Green: 0,
    Red: 1,
    Black: 2
});

var Roulette = {};

Roulette.$wheel = $('.roulette-wheel');
Roulette.$playButtons = $('.btn-play');
Roulette.$totalBets = $('.total-bet');
Roulette.$totalBetsAmounts = $('.total-bet-amount');
Roulette.$myBetsAmounts = $('.your-bet');
Roulette.$playerBets = $('.player-bets');
Roulette.$latest = $('.latest');
Roulette.$rolling = $('.rolling');
Roulette.$rollingInner = $('.rolling-inner');
Roulette.$betList = $('.bet-list');
Roulette.$value = $('.inputs-area .amount .value');
Roulette.$color = $('.btn-multi');

Roulette.currentColor = ERouletteColor.Red;

Roulette._settings = {
    maxTime: 15000,
    tileWidth: 132,
    rollTime: 7000,
    rollAnimation: $.bez([.06, .79, 0, 1]),
    tick: 30,
    minBet: 1,
    maxBet: 250000,
    minDisplayBet: 1
};

Roulette.rolling = false;
Roulette.countDownInterval = null;

Roulette.id = 0;
Roulette.timeLeft = 0;
Roulette.position = 0;

Roulette.order = [0, 11, 5, 10, 6, 9, 7, 8, 1, 14, 2, 13, 3, 12, 4];
Roulette.bets = [];

Roulette.sounds = {
    roll: new buzz.sound('/sounds/rolling.wav', { preload: true }),
    tone: new buzz.sound('/sounds/tone.wav', { preload: true })
};

Roulette.updateTime = function(time) {
    Roulette.timeLeft = time;
    Roulette.updateTimer();
};

Roulette.getColor = function(number) {
    if (number > 7) return ERouletteColor.Black;
    if (number > 0) return ERouletteColor.Red;
    return ERouletteColor.Green;
};

Roulette.rotateToNumber = function(number, diff, rotations) {
    rotations = rotations || 5;
    
    if (diff < 0.1) diff = 0.1;
    if (diff > 0.9) diff = 0.9;
    
    diff = diff - 0.5 || 0;
    
    Roulette.position = -1 * Roulette.order.indexOf(number) * Roulette._settings.tileWidth;
    Roulette.position += diff * Roulette._settings.tileWidth;
    
    var position = Roulette.position + Roulette.getAdjustmentWidth() - rotations * 15 * Roulette._settings.tileWidth;
    
    Roulette.rolling = true;
    Roulette.$playButtons.addClass('disabled');
    
    SkinUp.sound && Roulette.sounds.roll.play();
    
    var oldId = Roulette.id;
    
    Roulette.$wheel.animate({ backgroundPositionX: position }, Roulette._settings.rollTime, Roulette._settings.rollAnimation, function() {
        Roulette.rolling = false;
        Roulette.fixPosition();
        
        setTimeout(function() {
            Roulette.position -= diff * Roulette._settings.tileWidth;
        
            Roulette.$wheel.animate({
                backgroundPositionX: Roulette.position + Roulette.getAdjustmentWidth()
            }, 300, 'linear', Roulette.fixPosition);
        }, 300);
    
        SkinUp.sound && Roulette.sounds.tone.play();
        
        if (oldId !== Roulette.id) return;
        
        Roulette.updateHistory(number);
        
        Roulette.$totalBets.addClass('lose');
        
        var color = Roulette.getColor(number);
        var multiplier = color === ERouletteColor.Green ? 14 : 2;
        
        var $totalBetAmount = $('.total-bet-amount.color-' + color);
        var $totalBet = $('.total-bet.color-' + color);

        $totalBet.removeClass('lose').addClass('win');
        $totalBetAmount.text(Helpers.parseValue(parseInt($totalBetAmount.data('value'), 10) * multiplier));
    });
};

Roulette.getAdjustmentWidth = function() {
    return (Roulette.$wheel.width() - 15 * Roulette._settings.tileWidth) / 2;
};

Roulette.fixPosition = function() {
    if (Roulette.rolling) return;
    
    Roulette.$wheel.css({
        'background-position-x': Roulette.position + Roulette.getAdjustmentWidth()
    });
};

Roulette.updateHistory = function(number) {
    Roulette.$latest.find('.label').remove();
    while (Roulette.$latest.children().length >= 10) {
        Roulette.$latest.children().last().remove();
    }
    
    var color = Roulette.getColor(number);
    Roulette.$latest.prepend('<div class="last color-' + color + '"></div>');
    Roulette.$latest.prepend('<div class="label">' + locale.rouletteLatestLabel + '</div>');
};

Roulette.newRound = function(round) {
    Roulette.id = round.id;
    Roulette.bets = round.bets || [];
    
    Roulette.$playerBets.empty();
    Roulette.$playButtons.removeClass('disabled');
    Roulette.$totalBetsAmounts.data('value', 0).text(0);
    Roulette.$totalBets.removeClass('lose').removeClass('win');
    Roulette.$myBetsAmounts.removeClass('lose').removeClass('win').data('value', 0).text(0);
    
    $('.roulette-info .hash').text(round.hash);
    
    Roulette.updateDisplay();
    Roulette.startCountDown(round.time);
    if (round.number) Roulette.rotateToNumber(round.number, Math.random());
};

Roulette.counter = function() {
    Roulette.updateTime(Roulette.timeLeft - Roulette._settings.tick);
    if (Roulette.timeLeft <= 0) clearInterval(Roulette.countDownInterval);
};

Roulette.startCountDown = function(time) {
    clearInterval(Roulette.countDownInterval);
    
    Roulette.updateTime(time);
    Roulette.countDownInterval = setInterval(Roulette.counter, Roulette._settings.tick);
};

Roulette.updateTimer = function() {
    if (Roulette.timeLeft > 0) {
        Roulette.$rolling.fadeIn(200);
        Roulette.$rollingInner.html('<div>' + (Roulette.timeLeft / 1000).toFixed(2).replace('.', ':') + '</div> ' + locale.rouletteCountdown);
    } else {
        Roulette.$rolling.fadeOut(200);
    }
};

Roulette.addBet = function(bet) {
    Roulette.bets.push(bet);
    Roulette.displayBet(bet);
};

Roulette.displayBet = function(bet) {
    /* Outdated, I guess.
    if (steamid && bet.user.id === steamid) {
        var $myBet = $('.your-bet.color-' + bet.bet.color);
        $myBet.data('value', parseInt($myBet.data('value')) + bet.bet.value).text($myBet.data('value'));
    }
    */
    
    var $totalBet = $('.total-bet-amount.color-' + bet.bet.color);
    $totalBet.data('value', parseInt($totalBet.data('value')) + bet.bet.value).text(Helpers.parseValue($totalBet.data('value')));
    
    var $playerBet = $('.color-' + bet.bet.color + ' .player-bet[data-user="' + bet.user.id + '"]');
    
    if ($playerBet.length) {
        $playerBet.data('value', parseInt($playerBet.data('value'), 10) + bet.bet.value);
        $playerBet.find('.amount').text($playerBet.data('value'));
        
        if (parseInt($playerBet.data('value'), 10) >= Roulette._settings.minDisplayBet) $playerBet.removeClass('hidden');
    } else {
        var $bet = $(Roulette.generateBetHTML(bet));
        
        if (bet.bet.value >= Roulette._settings.minDisplayBet || bet.user.id == steamid) {
            $bet.hide().prependTo($('.bet-list.color-' + bet.bet.color + ' .player-bets')).fadeIn(500);
        } else {
            $bet.addClass('hidden').prependTo($('.bet-list.color-' + bet.bet.color + ' .player-bets'));
        }
    }
    
    Roulette.sortColor(bet.bet.color);
};

Roulette.generateBetHTML = function(bet) {
    var html = '';
    
    html += '<div class="player-bet" data-value="' + bet.bet.value + '" data-user="' + bet.user.id + '">\n';
    html += '  <div class="user"><img src="' + Helpers.avatarFromHash(bet.user.avatarHash) + '">' + bet.user.username + '</div>\n';
    html += '  <div class="amount">' + Helpers.parseValue(bet.bet.value) + '</div>\n';
    html += '</div>\n';
    
    return html;
};

Roulette.sortColor = function(color) {
    var $wrapper = $('.bet-list.color-' + color + ' .player-bets');
    
    $wrapper.find('.player-bet').sort(function(a, b) {
        var $a = $(a);
        var $b = $(b);
        var aValue = $a.data('value');
        var bValue = $b.data('value');
        
        if (aValue === bValue) {
            return $b.data('user') - $a.data('user');
        } else {
            return bValue - aValue;
        }
    }).appendTo($wrapper);
};

Roulette.updateDisplay = function() {
    Roulette.$playerBets.empty();
    Roulette.$myBetsAmounts.data('value', 0).text(0);
    
    Roulette.bets.forEach(function(bet) {
        Roulette.displayBet(bet);
    })
};

Roulette.bindButtons = function() {
    Roulette.$color.on('click', function() {
        Roulette.$color.removeClass('active');
        $(this).addClass('active');
        Roulette.currentColor = $(this).data('color');
    });
    
    $('.inputs-area .button').on('click', function() {
        var value = parseInt(Roulette.$value.val(), 10);
        var balance = parseInt($('.balance').data('balance'), 10);
        if (isNaN(value)) value = 0;
        
        switch($(this).data('action')) {
            case "clear": value = 0; break;
            case "last": value = parseInt(localStorage.getItem("skinup.lastBet"), 10); break;
            case "min": value = Roulette._settings.minBet; break;
            case "max": value = Roulette._settings.maxBet; break;
            case "100+": value += 100; break;
            case "1000+": value += 1000; break;
            case "10000+": value += 10000; break;
            case "100-": value -= 100; break;
            case "1000-": value -= 1000; break;
            case "10000-": value -= 10000; break;
            case "1/2": value *= 0.5; break;
            case "x2": value *= 2; break;
            case "x3": value *= 3; break;
        }
        
        if (value > balance) value = balance;
        if (value < 0 || isNaN(value)) value = 0;
        Roulette.$value.val(value);
    });
    
    $('.controls .btn-play').on('click', function() {
        var value = parseInt(Roulette.$value.val(), 10);
        //if (isNaN(value) || value <= 0) return Roulette.$value.val(0);
        //localStorage.setItem('skinup.lastBet', value);
        //socket.emit('roulette-bet', { color: Roulette.currentColor, value: value });
		console.log(Roulette.currentColor);
		complete.log(value);
    });
};

Roulette.endRound = function(round) {
    Roulette.rotateToNumber(round.winningNumber, round.shift);
};

Roulette.onRound = function(data) {
    data.history.forEach(function(number) {
        Roulette.updateHistory(number);
    });
    
    Roulette.newRound(data.round);
};

Roulette.onEvent = function(event) {
    switch(event.type) {
        case 'start':
            Roulette.newRound(event.round);
            break;
        case 'end':
            Roulette.endRound(event.round);
            break;
        case 'bet':
            Roulette.addBet(event.bet);
            break;
    }
};

Roulette.init = function() {
    Roulette.bindButtons();
    
    channels.roulette = socket.subscribe('game:roulette', { waitForAuth: true });
    channels.roulette.watch(Roulette.onEvent);
    
    bus.on('roulette-round', Roulette.onRound);
    
    $(window).resize(Roulette.fixPosition);
    $(document).ready(Roulette.fixPosition);
};

Roulette.init();
