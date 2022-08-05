(() => {
	$.dethrottle = (func, timeout) => {
		let timer = null;
		return () => {
			let context = this;
			let args = arguments;
			if(timer) {
				clearTimeout(timer);
			}
			timer = setTimeout(() => func.apply(context, args), timeout);
		}
	};
	$.fn.disabled = function(x) {
		if(undefined === x) {
			return undefined !== this.attr('disabled');
		}
		if(x) {
			this.attr('disabled', 'disabled');
		} else {
			this.removeAttr('disabled');
		}
		return this;
	};
	mdui.promises = {};
	mdui.promises.confirm = (text, title, options) => {
		return new Promise((resolve, reject) => {
			mdui.confirm(text, title, () => {
				resolve(true);
			}, () => {
				resolve(false);
			}, options);
		});
	};
})();
