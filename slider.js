var isMobile = false;

function randomRange(min, max) {
	return min + Math.floor((max - min) * Math.random());
}

var Slider = (function () {
	var template = [
		'<div class="slider">',
			'<div class="thumb"></div>',
			'<div class="track"></div>',
			'<div class="track track-fill"></div>',
		'</div>'
	].join('');

	var cache = {};
	var disabledBlacklist = [];

	var thumbWidth = 20;
	var startedFlag = false;
	var defaultMinValue = 0;
	var defaultMaxValue = 100;

	var defaultTrackHeight = 2;
	var defaultTrackColor = 'blue';
	var defaultFilledColor = 'black';
	var defaultThumbWidth = 20;
	var defaultThumbColor = 'red';
	
	var tempSliderId;

	function validate(val, minVal, maxVal) {
		if (val > maxVal) {
			val = maxVal;
		} else if (val < minVal) {
			val = minVal
		}
		return val;
	}

	function resetThumbPosition(pageX) {

		var slider = cache[tempSliderId].slider;
		var thumb = cache[tempSliderId].thumb;
		var trackFill = cache[tempSliderId].trackFill;
		var maxOffset = cache[tempSliderId].maxOffset;
		var minOffset = cache[tempSliderId].minOffset;
		var thumbWidth = cache[tempSliderId].thumbWidth;

		var tempOffset = pageX - slider.offsetLeft;
		tempOffset = validate(tempOffset, minOffset, maxOffset);
		cache[tempSliderId]._currentOffset = tempOffset;

		thumb.style.left = tempOffset + 'px';
		trackFill.style.width = tempOffset + thumbWidth / 2 + 'px';

		return tempOffset / maxOffset;
	}

	function preventDefault(e) {
		e.preventDefault();
	}

	function updateOffsetAndValue(pageX) {
		var movePercentage = resetThumbPosition(pageX);
		var maxValue = cache[tempSliderId].maxValue;
		var minValue = cache[tempSliderId].minValue;
		var value = minValue + (maxValue - minValue) * movePercentage;
		var progress = computeProgress(value, minValue, maxValue);
		cache[tempSliderId].currentValue = value;

		var changeEventHandler = cache[tempSliderId].onChange;

		if (changeEventHandler) {
			changeEventHandler.call(this, value, progress);
		}

		return {
			value: value,
			progress: progress
		}
	}

	function getPageX(event) {
		return event.pageX != undefined ? event.pageX : event.touches[0].pageX;
	}

	function startHandler(event) {
		var target = event.currentTarget;
		var sliderId = target.getAttribute('data-slider');
		if (disabledBlacklist.indexOf(sliderId) > -1) {
			return;
		}
		tempSliderId = sliderId;

		var currentValue = cache[tempSliderId].currentValue;
		var progress = computeProgress(
			currentValue, 
			cache[tempSliderId].minValue, 
			cache[tempSliderId].maxValue
		);

		var startEventHandler = cache[tempSliderId].onStart;
		if (startEventHandler) {
			var result = startEventHandler.call(this, currentValue, progress);
			if (result == false) {
				return false;
			}
		}

		startedFlag = true;
		updateOffsetAndValue(getPageX(event));
	}

	function moveHandler(event) {
		if (!startedFlag) {
			return;
		}
		
		var state = updateOffsetAndValue(getPageX(event));
	}

	function stopHandler(event) {
		if (!startedFlag) {
			return;
		}
		var currentValue = cache[tempSliderId].currentValue;
		var progress = computeProgress(
			currentValue, 
			cache[tempSliderId].minValue, 
			cache[tempSliderId].maxValue
		);

		startedFlag = false;
		var stopEventHandler = cache[tempSliderId].onStop;
		if (stopEventHandler) {
			stopEventHandler.call(this, currentValue, progress);
		}
	}

	function getSliderWidth(slider) {
		return parseInt(window.getComputedStyle(slider).width);
	}

	function getSliderHeight(slider) {
		return parseInt(window.getComputedStyle(slider).height);
	}

	function computeProgress(value, min, max) {
		return (value - min) / (max - min);
	}

	function initialize(option) {
		var container = option.el;

		container.innerHTML = template;
		var slider = container.querySelector('.slider');
		var trackFill = container.querySelector('.track-fill');
		var thumb = container.querySelector('.thumb');

		var sliderId = 'slider' + randomRange(1, 1000);
		slider.setAttribute('data-slider', sliderId);

		option.style = option.style || {};
		var thumbWidth = option.style.thumbWidth || defaultThumbWidth;
		var thumbColor = option.style.thumbColor || defaultThumbColor;
		var trackHeight = option.style.trackHeight || defaultTrackHeight;
		var trackColor = option.style.trackColor || defaultTrackColor;
		var filledColor = option.style.filledColor || defaultFilledColor;

		var sliderWidth = getSliderWidth(slider);
		var sliderHeight = getSliderHeight(slider);

		thumb.style.width = thumbWidth + 'px';
		thumb.style.height = thumbWidth + 'px';
		thumb.style.backgroundColor = thumbColor;
		thumb.style.top = (sliderHeight - thumbWidth) / 2 + 'px';
		thumb.style.borderRadius = thumbWidth / 2 + 'px';

		var track = document.querySelector('.track');
		track.style.height = trackHeight + 'px';
		track.style.backgroundColor = trackColor;
		track.style.marginTop = trackHeight / -2 + 'px';

		var trackFill = document.querySelector('.track-fill');
		trackFill.style.height = trackHeight + 'px';
		trackFill.style.backgroundColor = filledColor;
		trackFill.style.marginTop = trackHeight / -2 + 'px';

		defaultMinValue = option.min;

		var sliderObject = cache[sliderId] = {
			slider: slider,
			trackFill: trackFill,
			thumb: thumb,
			
			currentValue: option.value || defaultMinValue,
			minValue: option.min || defaultMinValue,
			maxValue: option.max || defaultMaxValue,
			
			_currentOffset: 0,
			minOffset: 0,
			maxOffset: sliderWidth - thumbWidth,
			
			thumbWidth: thumbWidth,
			
			onStart: option.onStart,
			onChange: option.onChange,
			onStop: option.onStop
		}

		var percentage = computeProgress(sliderObject.currentValue, sliderObject.minValue, sliderObject.maxValue);
		tempSliderId = sliderId;
		resetThumbPosition(percentage * sliderObject.maxOffset + slider.offsetLeft);

		if (!isMobile) {
			slider.addEventListener('mousedown', startHandler);
		} else {
			slider.addEventListener('touchstart', startHandler);
		}

		slider.addEventListener('dragstart', preventDefault);
		slider.addEventListener('dragover', preventDefault);
		slider.addEventListener('drop', preventDefault);

		return sliderId;
	}

	if (!isMobile) {
		document.addEventListener('mousemove', moveHandler);
	} else {
		document.addEventListener('touchmove', moveHandler);
	}

	if (!isMobile) {
		document.addEventListener('mouseup', stopHandler);
	} else {
		document.addEventListener('touchend', stopHandler);
	}

	window.addEventListener('resize', function () {
		for (var sliderId in cache) {

			var sliderObject = cache[sliderId];
			var sliderWidth = getSliderWidth(sliderObject.slider);
			var thumbWidth = sliderObject.thumbWidth;
			var maxOffset = sliderObject.maxOffset = (sliderWidth - thumbWidth);
			var minOffset = sliderObject.minOffset;

			var currentValue = sliderObject.currentValue;
			var minValue = sliderObject.minValue;
			var maxValue = sliderObject.maxValue;
			var currentOffset = computeProgress(currentValue, minValue, maxValue) * maxOffset;
			resetThumbPosition(currentOffset + sliderObject.slider.offsetLeft);
		}
	});

	return {
		init: function (option) {
			var sliderId = initialize(option);
			return {
				setValue: function (value) {
					var sliderObject = cache[sliderId];
					var minValue = sliderObject.minValue;
					var maxValue = sliderObject.maxValue;
					var maxOffset = sliderObject.maxOffset;
					value = validate(value, minValue, maxValue);
					var currentOffset = computeProgress(value, minValue, maxValue) * maxOffset;
					resetThumbPosition(currentOffset + sliderObject.slider.offsetLeft);
				},
				getValue: function () {
					return cache[sliderId].currentValue;
				},
				getProgress: function () {
					var sliderObject = cache[sliderId];
					return (sliderObject.currentValue - sliderObject.minValue) / (sliderObject.maxValue - sliderObject,minValue);
				},
				destory: function () {
					var slider = cache[sliderId].slider;
					slider.parentNode.removeChild(slider);
				},
				disable: function () {
					disabledBlacklist.push(sliderId);
				},
				enable: function () {
					var index = disabledBlacklist.indexOf(sliderId);
					if (index > -1) {
						disabledBlacklist.splice(index, 1);
					}
				}
			}
		}
	}
})();