Component({
	properties: {
		columns: {
			type: Number,
			value: 1
		},
		itemData: {
			type: Object,
			value: {}
    },
		deleteIcon:{
			type:String,
			value:""
		}
	},
	methods: {
		itemClick(e) {
			this.triggerEvent('click');
		},
		handleDeleteImg(e){
			this.triggerEvent('delete');
		}
	},
	ready() {
	}
})