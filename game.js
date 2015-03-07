var game = angular.module('game', ['dealerEngine']);

game.controller('gameController', ['$scope', '$rootScope', 'Deck', 'Player', 'Dealer', function($scope, $rootScope, Deck, Player, Dealer) {
	Deck.initDeck();
	Deck.shuffle();
	$rootScope.gameStarted = false;
	$rootScope.gameState = "init"; // init, ongoing, over
	$rootScope.players = ["dealer", "player1"];
	$rootScope.turn = 0;
	$rootScope.gameUpdates = " ";

	$rootScope.getBoardInfo = function() {
		var boardInfo = {
			numOfPlayerCards: Player.getNumOfCards(),
			numOfDealerCards: Dealer.getNumOfCards(),
			playerFaceUpCardMinBlackValue: Player.getFaceUpCardMinBlackValue(),
			dealerFaceUpCardValue: Dealer.getFaceUpCardValue()
		}
		return boardInfo;
	}

	$rootScope.moveToNextPlayer = function() {
		$rootScope.turn = ($rootScope.turn + 1) % ($rootScope.players.length);
	}

	$rootScope.currentPlayer = function() {
		return $rootScope.players[$rootScope.turn];
	}

	$scope.deal = function () {
		if (!$rootScope.gameStarted) {
			Player.addCard(Deck.dealHand(2));
			Dealer.addCard(Deck.dealHand(2));

			if (Player.isBlackJack() || Dealer.isBlackJack()) {
				$scope.settle(false, true);
				return;
			}
			$rootScope.gameStarted = true;
			$rootScope.moveToNextPlayer();
			$rootScope.gameState = "ongoing";
			$rootScope.gameUpdates = "Dealt";

		} else {
			alert("trying to give up? click surrender");
		}
	};

	$scope.playerHit = function () {
		if ($rootScope.currentPlayer() === "player1") {
			if (Player.isTurnClosed()) {
				alert("you closed your turn");
				return;
			}

			Player.addCard(Deck.dealCard());
			$rootScope.gameUpdates = "\nPlayer Hit";

			if (Player.getMinPoints() > 21) {
				$scope.settle(true);
				return;
			}
			$rootScope.moveToNextPlayer();
			$scope.dealerReact();

		} else {
			if (!$rootScope.gameStarted) alert("Start game by clicking 'Deal'");
			else alert("dealer's turn");
		}
	}

	$scope.playerStand = function () {
		if ($rootScope.currentPlayer() === "player1") {
			if (Player.isTurnClosed()) {
				alert("you closed your turn");
				return;
			}
			$rootScope.gameUpdates = "\nPlayer Stand; Player's turn closed";

			Player.closeTurn();
			$rootScope.moveToNextPlayer();
			$scope.dealerReact();
		} else {
			if (!$rootScope.gameStarted) alert("Start game by clicking 'Deal'");
			else alert("dealer's turn");
		}
	}

	// TODO
	$scope.playerSplit = function() {
		alert("sorry! the game engine is now too stupid to handle splits");
	}

	$scope.dealerReact = function () {
		var busted = false;
		if (Player.isTurnClosed()){
			while (!Dealer.isTurnClosed()) {
				busted = $scope.dealerDeciding();
				if (busted) break;
			}
			$scope.settle(busted);

		} else {
			if (!Dealer.isTurnClosed()) {
				busted = $scope.dealerDeciding();
			}
			if (busted) {
				$scope.settle(busted);
			} else {
				$rootScope.moveToNextPlayer();
			}
		}
	}

	$scope.dealerDeciding = function() {
		var decision = Dealer.decide($rootScope.getBoardInfo());
		// Display a success toast, with a title

		if (decision == "hit") {
			Dealer.addCard(Deck.dealCard());
			$rootScope.gameUpdates = "Dealer Hit";
			// TODO
			$scope.$apply();
			if (Dealer.getMinPoints() > 21) {
				return true;
			}

		} else {
			Dealer.closeTurn();
			$rootScope.gameUpdates = "\nDealer Stand; Dealer's turn closed";
		}

		return false;
	}

	$scope.settle = function(busted, blackJack) {
		blackJack = blackJack || false;
		var playerPoints = Player.getFinalPoints();
		var dealerPoints = Dealer.getFinalPoints();
		var gameResult = null;
		Dealer.allCardsFaceUp();
		// TODO
		$scope.$apply();
		$rootScope.gameState = "over";
		if (busted) {
			gameResult = (playerPoints > 21) ? "you busted" : "dealer busted";
		} else if (blackJack) {
			gameResult = (playerPoints == 21) ? "player blackjack" : "dealer blackjack";
		} else {
			var PlayerDiff = 21 - playerPoints;
			var DealerDiff = 21 - dealerPoints;
			if (PlayerDiff == DealerDiff) {
				gameResult = "push";
			} else if (PlayerDiff > DealerDiff) {
				gameResult = "lose";
			} else {
				gameResult = "win";
			}
		}
		alert("result: " + gameResult);
		$scope.clearBoard();
	}

	$scope.clearBoard = function() {
		$rootScope.gameStarted = false;
		$rootScope.gameState = "init"; // init, ongoing, push, lose, win
		$rootScope.players = ["dealer", "player1"];
		$rootScope.turn = 0;
		$rootScope.gameUpdates = "";

		Player.clearHand();
		Dealer.clearHand();
		Deck.Collect();
		Deck.shuffle();
	}
}]);


game.controller('playerPanelController', ['$scope', '$rootScope', 'Player', function($scope, $rootScope, Player){
	$scope.playerCardsFromFactory = Player;
}]);


game.controller('dealerPanelController', ['$scope', '$rootScope', 'Dealer', function($scope, $rootScope, Dealer){
	$scope.dealerCardsFromFactory = Dealer;
}]);



game.factory('Dealer', ['dealerDecisionEngine', function(dealerDecisionEngine){
	var dealerModel = {};
	dealerModel.dealerCards = [];
	dealerModel.init = false;
	dealerModel.turnClosed = false;

	dealerModel.addCard = function(cards) {
		dealerModel.dealerCards = dealerModel.dealerCards.concat(cards);
		if (!dealerModel.init) {
			dealerModel.dealerCards[0].faceup = true;
			dealerModel.init = true;
		}
	},

		dealerModel.getCards = function() {
			return dealerModel.dealerCards;
		},

		dealerModel.getNumOfCards= function() {
			return dealerModel.dealerCards.length;
		},

		dealerModel.getFaceUpCardValue= function() {
			if (dealerModel.dealerCards.length == 0) return null;
			return dealerModel.dealerCards[0].value;
		},

		dealerModel.getMinPoints= function() {
			var points = 0;
			for (var i = 0; i < dealerModel.dealerCards.length; i++) {
				points += dealerModel.dealerCards[i].minBlackValue;
			}
			return points;
		},

		dealerModel.getMaxPoints = function() {
			var points = 0;
		    var numOfAce = 0;
			for (var i = 0; i < dealerModel.dealerCards.length; i++) {
		    	points += dealerModel.dealerCards[i].minBlackValue;
		    	if (dealerModel.dealerCards[i].value == 1) numOfAce++;
		    }
		    while (numOfAce > 0 && points + 10 <= 21) {
		    	numOfAce--;
		    	points += 10;
		    }
			return points;
		},

		dealerModel.getFinalPoints= function() {
			return dealerModel.getMaxPoints();
		},

		dealerModel.decide= function(boardInfo) {
			console.log(boardInfo);
			// TODO
			var p1 = dealerDecisionEngine
							.probOfBustIfHit(
								boardInfo.playerFaceUpCardMinBlackValue,
								dealerModel.dealerCards,
								dealerModel.getMinPoints());


			var p2 = dealerDecisionEngine
							.probOfDealerPointsLessThanPlayer (
								boardInfo.numOfPlayerCards,
								boardInfo.playerFaceUpCardMinBlackValue,
								dealerModel.dealerCards,
								dealerModel.getMaxPoints()
								);
			// console.log("p1="+p1);
			// console.log("p2="+p2);
			var pHit = (1-p1)*0.9 + p2*0.1;
			// console.log("phit="+pHit);
			return (pHit > 0.46) ? "hit" : "stand";
		},

		dealerModel.isTurnClosed = function() {
			return dealerModel.turnClosed;
		}

		dealerModel.closeTurn = function() {
			dealerModel.turnClosed = true;
		}

		dealerModel.clearHand = function() {
			dealerModel.dealerCards = [];
			dealerModel.init = false;
			dealerModel.turnClosed = false;
		},

		dealerModel.allCardsFaceUp = function() {
			for (var i = 0; i < dealerModel.dealerCards.length; i++) {
				dealerModel.dealerCards[i].faceup = true;
			}
		},

		dealerModel.isBlackJack = function() {
			return (dealerModel.dealerCards.length == 2
				&& dealerModel.getFinalPoints() == 21);
		}

	return (dealerModel);
}]);

game.factory('Player', function(){
	var playerModel = {};
	playerModel.playerCards = [];
	playerModel.init = false;
	playerModel.turnClosed = false;

	playerModel.addCard = function(cards) {
		playerModel.playerCards = playerModel.playerCards.concat(cards);
		if (!playerModel.init) {
			playerModel.playerCards[0].faceup = true;
			playerModel.init = true;
		}
	},

	playerModel.getCards = function() {
		return playerModel.playerCards;
	},

	playerModel.getNumOfCards = function() {
		return playerModel.playerCards.length;
	},

	playerModel.getFaceUpCardMinBlackValue = function() {
		if (playerModel.playerCards.length == 0) return null;
		return playerModel.playerCards[0].minBlackValue;
	},

	playerModel.getMinPoints = function() {
		var points = 0;
		for (var i = 0; i < playerModel.playerCards.length; i++) {
			points += playerModel.playerCards[i].minBlackValue;
		}
		return points;
	},

	playerModel.getMaxPoints = function() {
		var points = 0;
	    var numOfAce = 0;
		for (var i = 0; i < playerModel.playerCards.length; i++) {
	    	points += playerModel.playerCards[i].minBlackValue;
	    	if (playerModel.playerCards[i].value == 1) numOfAce++;
	    }
	    while (numOfAce > 0 && points + 10 <= 21) {
	    	numOfAce--;
	    	points += 10;
	    }
		return points;
	},

	playerModel.getFinalPoints = function() {
		return playerModel.getMaxPoints();
	},

	playerModel.isTurnClosed = function() {
		return playerModel.turnClosed;
	}

	playerModel.closeTurn = function() {
		playerModel.turnClosed = true;
	}

	playerModel.clearHand = function() {
		playerModel.playerCards = [];
		playerModel.init = false;
		playerModel.turnClosed = false;
	},

	playerModel.isBlackJack = function() {
		console.log("playerModel.dealerCards.length="+playerModel.playerCards.length);
		console.log("playerModel.getFinalPoints()="+playerModel.getFinalPoints());


		return (playerModel.playerCards.length == 2
			&& playerModel.getFinalPoints() == 21);
	}
	return (playerModel);
});


game.service('Deck', function() {
	this.suit = ["Club", "Diamond", "Heart", "Spade"];
	this.deck = [];

	this.initDeck = function() {
		for (var i = 0; i < 13; i++) {
		    for (var j = 0; j < this.suit.length; j++) {
		    	var minBlackValue = (i + 1 > 10) ? 10 : (i+1);
		    	var maxBlackValue = (i + 1 == 1) ? 11 : minBlackValue;
		        var card = {
		            type: this.suit[j],
		            value: i+1,
		            faceup: false,
		            minBlackValue: minBlackValue,
		            maxBlackValue: maxBlackValue
		        }
		        this.deck.push(card);
		    }
		}
	}

	this.shuffle = function() {
		// http://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
		for (var i = this.deck.length - 1; i > 0; i--) {
	        var j = Math.floor(Math.random() * (i + 1));
	        var temp = this.deck[i];
	        this.deck[i] = this.deck[j];
	        this.deck[j] = temp;
    	}
	}

	this.dealHand = function(num) {
		return this.deck.splice(0, num);
	}

	this.dealCard = function() {
		return this.deck.splice(0, 1);
	}

	this.Collect = function() {
		this.deck = [];
		this.initDeck();
	}

	this.display = function() {
		for (var i = 0; i < this.deck.length; i++) {
			console.log(this.deck[i]);
		}
	}

});
