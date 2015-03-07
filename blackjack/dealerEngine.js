var engine = angular.module('dealerEngine', [ ]);

engine.factory('dealerDecisionEngine', function(){
	// randomly generate possible cards combo in player's hand
	var samplePlayerHand = function(numOfPlayerCards, playerFaceUpCardBlackJackValue, numOfUnknownCards, pointCount) {
	    var sample = []; //new int[numOfPlayerCards];
	    var occupied = []; // new int[MAX_POINT_PER_CARD];
	    for (var i = 0; i < numOfPlayerCards; i++) {
	    	sample.push(0);
	    }
	    for (var i = 0; i < 10; i++) {
	    	occupied.push(0);
	    }

	    sample[0] = playerFaceUpCardBlackJackValue;
	    for (var i = 1; i < numOfPlayerCards; i++) {

	    	var r = Math.floor(Math.random() * (numOfUnknownCards - i + 1)) + 1;
	      	var s = 0;
	      	for (var k = 1; k < 10; k++) {
	        	var t = pointCount[k] - occupied[k];
	        	s = s + t;
	        	if (t > 0 && s >= r) {
	          	sample[i] = k;
	          	break;
	        	}
	      	}
	    }
	    return sample;
	}

	return {
		testEngine: function() {
			console.log("test bridging module");
		},

		probOfBustIfHit: function(playerFaceUpCardMinBlackValue, dealerCards, dealerMinPoints) {

			if (dealerMinPoints <= 10) return 0;

			var pointCount = [];
		    pointCount.push(0);
		    for (var i = 1; i <= 10; i++) {
				pointCount.push(4);
			}
		    pointCount[10] += 3 * 4; // J, Q, K
		    pointCount[playerFaceUpCardMinBlackValue]--;

			var len = dealerCards.length;
			for (var i = 0; i < len; i++) {
				pointCount[dealerCards[i].minBlackValue]--;
			}

			var numerator = 0;
			for (var r = 21 - dealerMinPoints; r > 0; r--) {
				numerator += pointCount[r];
			}
			console.log("numerator="+numerator);
			var numOfHiddenCards = (52 - len - 1);
			return (1 - (numerator / numOfHiddenCards));
		},

		probOfDealerPointsLessThanPlayer: function(numOfPlayerCards, playerFaceUpCardMinBlackValue, dealerCards, dealerMaxPoints) {
			// console.log("dealer cards: ")
			// for (var i = 0; i < dealerCards.length; i++) {
			// 	console.log(dealerCards[i]);
			// }
			// console.log("dealer max points: "+ dealerMaxPoints);

			// console.log("player card: ")
			// console.log("numOfPlayerCards="+numOfPlayerCards);
			// console.log("playerFaceUpCardMinBlackValue="+playerFaceUpCardMinBlackValue);


		    var pointCount = [];
		    pointCount.push(0);
		    for (var i = 1; i <= 10; i++) {
				pointCount.push(4);
			}
		    pointCount[10] += 3 * 4; // J, Q, K
		    pointCount[playerFaceUpCardMinBlackValue]--;

			var len = dealerCards.length;
			for (var i = 0; i < len; i++) {
				pointCount[dealerCards[i].minBlackValue]--;
			}

		    var numOfHiddenCards = 52 - len - 1;
		    var win = 0, lose = 0;
		    // MAX_NUMBER_OF_SAMPLES = 1000000
		    for (var i = 0; i < 1000; i++) {
		    	// sample player hand
		      	var sample = samplePlayerHand(numOfPlayerCards, playerFaceUpCardMinBlackValue, numOfHiddenCards, pointCount);
				// console.log(sample);
		      	var samplePoints = 0;
			    for (var k = 0; k < sample.length; k++) {
			    	samplePoints += sample[k];
			    }

			    // legal sample
			    if (samplePoints > 21) continue;

			    // max non busted sample points
			    var sampledPlayerMaxPoints = 0;
			    var numOfAce = 0;
				for (var k = 0; k < sample.length; k++) {
			    	sampledPlayerMaxPoints += sample[k];
			    	if (sample[k] == 1) numOfAce++;
			    }
			    while (numOfAce > 0 && sampledPlayerMaxPoints + 10 <= 21) {
			    	numOfAce--;
			    	sampledPlayerMaxPoints += 10;
			    }

				if (dealerMaxPoints > sampledPlayerMaxPoints) win++;
				if (dealerMaxPoints < sampledPlayerMaxPoints) lose++;
		    }
		    return (win + lose > 0) ? 1.0 * win / (win + lose) : 0.5;
		},
	};
});

