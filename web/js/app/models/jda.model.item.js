(function(Browser) {
	Browser.Items = Browser.Items||{};
	
	Browser.Items.Model = Backbone.Model.extend({

		type:'item',

		defaults : {
			'media_creator_realname' : 'unknown',
			'media_creator_username' : 'unknown',
		},
		initialize : function()
		{
			this.tags=new Browser.Tags.Collection();
		},

		loadTags : function(successFunction, errorFunction)
		{
			this.tags.reset({silent:true});
			this.tags.item_id=this.id;
			this.tags.fetch({ 
				success:successFunction,
				error:errorFunction,
			});
		},
		parse : function(response)
		{
			if (response.items)
				return response.items[0];
			else 
				return response;
		},
		url : function(){ 
			
			if(_.isUndefined(this.id)) var url = jda.app.apiLocation + 'api/collections/items';
			else var url = jda.app.apiLocation + 'api/items/' + this.id;
			console.log(this.id);
			console.log("Final url for getting item is: " + url);
			return url;
		},
	});

})(jda.module("browser"));
