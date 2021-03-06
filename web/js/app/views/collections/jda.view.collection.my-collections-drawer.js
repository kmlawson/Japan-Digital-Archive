(function(Browser) {
	
	Browser.Items = Browser.Items || {};
	Browser.Items.Collections = Browser.Items.Collections || {};
	Browser.Items.Collections.Views =  Browser.Items.Collections.Views || {};
	
	
	Browser.Items.Collections.Views.MyCollectionsDrawer = Backbone.View.extend({
		
		el : $('#zeega-my-collections'),
		
		initialize : function()
		{
			
			this.collection = new Browser.Items.Collection();
			this.collection.url=jda.app.apiLocation + 'api/search?r_collections=1&user=-1';
			this.collection.parse= function(data)
				{
					console.log(data.collections);
					return data.collections;
				}
			//show 3 thumbnails by default in collections drawer
			this.showThumbnailCount = 3;
			
			
			
		},

		render : function(){
			var _this = this;

			//Render collection list in drop-down menu
			$(_this.el).find('.dropdown-menu').empty();
			
			_.each( _.toArray(this.collection), function(item){
			
				if(!_.isUndefined(item.id)) var id =item.id;
				else id = -1;
				var itemView = '<li class="zeega-collection-list-item" id="'+id+'"><a href=".">'+item.get('title')+'</a></li>';
				$(_this.el).find('.dropdown-menu').append(itemView);
				
				$(_this.el).find('#'+id).click( function(e){
					if ($(this).attr('id') != _this.activeCollectionID){
						_this.switchActiveCollection($(this).attr('id'));
						e.preventDefault();
					}
				});
			});
			/* 
				If they don't have any collections then make a new one but
				don't save it till they add to it
			*/
			if ($(this.el).find('.zeega-collection-list-item').length == 0){
				
				this.activeCollection = new Items.Model({
					title:$('#zeega-my-collections-active-collection').text(),
					child_items:[],
					newItemIDS:[],
				});
				this.activeCollection.set({title:$('#zeega-my-collections-active-collection').text()}); 
				this.activeCollection.set({child_items:[]}); 
				this.activeCollection.set({newItemIDS:[]}); 
				
			} 
			/* 
				Otherwise make the first collection in the list the active one for the
				my Collection drawer
			*/
			else {
				var activeCollectionID = $(this.el).find('.zeega-collection-list-item').first().attr("id");
				this.switchActiveCollection(activeCollectionID);
			}
			
			

			$(this.el).find('#zeega-my-collections-items').droppable({
			    accept : '.list-fancymedia',
			    hoverClass : 'zeega-my-collections-items-dropping',
			    tolerance : 'pointer',

			    drop : function( event, ui ){
			    
			    	//TODO -- Check whether user is logged in - if not then log them in before adding
					if(sessionStorage.getItem('user')!=1){
						$(_this.el).find('#zeega-my-collections-items').addClass('zeega-my-collections-items-dropping');
					
						_this.activeCollection.attributes.child_items.push(jda.app.draggedItem.toJSON());
						_this.renderCollectionPreview(_this.activeCollection);
	
						var newItems = _this.activeCollection.attributes.newItemIDS.push(jda.app.draggedItem.id);
						
						
						_.delay(function(){$(_this.el).find('#zeega-my-collections-items').removeClass('zeega-my-collections-items-dropping');},1000);
					
					}
					else if(_.difference([jda.app.draggedItem.id],_.pluck(_this.activeCollection.attributes.child_items,"id")).length==0){
						
						console.log('duplicate');
						
					}
				
					else {
						
						$(_this.el).find('#zeega-my-collections-items').addClass('zeega-my-collections-items-dropping');
					
						_this.activeCollection.attributes.child_items.push(jda.app.draggedItem.toJSON());
						_this.renderCollectionPreview(_this.activeCollection);
						  
						var itemId=jda.app.draggedItem.id;
						
						_this.activeCollection.url=jda.app.apiLocation + 'api/collections/' + _this.activeCollection.id+'/items';
				
						
						_this.activeCollection.save({newItemIDS:[itemId ]},
								{
									success : function(model, response){ 
										
										$(_this.el).find('#zeega-my-collections-items').removeClass('zeega-my-collections-items-dropping');
										_this.renderCollectionPreview(model);	
									},
									error : function(model, response){
										console.log(response);
		
									}
								}
							);
						}
					ui.draggable.draggable('option','revert',false);
					
			    }
			});
			  
	
			return this;
		},
		
		switchActiveCollection :function(activeCollectionID){
			var _this = this;
			
			$('#zeega-my-collections-items').spin();
			if(activeCollectionID!=-1) 
			
			{
				this.activeCollection = new Browser.Items.Model({id:activeCollectionID});
				
				this.activeCollection.fetch(
				{
					//Display the first x thumbnails in the collection
					success : function(model, response)
					{ 
						
						_this.renderCollectionPreview(model);
						$('#zeega-my-collections-items').spin('false');
					},
					error : function(model, response)
					{ 
						console.log('Error getting active collection for collections drawer');
	
					}
				});
			}
			else{
				this.activeCollection = new Browser.Items.Model({
					title:$('#zeega-my-collections-active-collection').text(),
					child_items:[],
					newItemIDS:[],
					
				});
				$('#zeega-my-collections-items').spin(false );
			}
		},
		
		renderCollectionPreview: function(model){
					console.log('RENDERING COLLECTION PREVIEW',model);
					var title = model.get('title');
					var remainingItems = model.get('child_items').length - this.showThumbnailCount;
					var _this=this;
					
					$('#zeega-my-collections-items-thumbs').empty();
					$('#zeega-my-collections-active-collection').text(model.get('title'));
					$('#zeega-my-collections-count').text(remainingItems);

					if (model.get('child_items').length == 0){
						$('#zeega-my-collections-drag-items-here,.jdicon-drag').show();
					} else{
						$('#zeega-my-collections-drag-items-here,.jdicon-drag').hide();
					}

					if (remainingItems > 0){
						$('#zeega-my-collections-count-string').show();
					} else {
						$('#zeega-my-collections-count-string').hide();	
					}
					
					if(sessionStorage.getItem('user')!=1){
						$('#zeega-my-collections-share-and-organize').html("<a href='#' >Save Collection</a>").click(function(){
							$('#login-modal').modal('show'); 
						}).show();
					}
					else{
					$('#zeega-my-collections-share-and-organize').html("<a href='#' >Share and Organize</a>").unbind().click(function(){
						jda.app.addFilter(_this.activeCollection, 'collection');
						return false;
						}).show();
					}
					
					var kids = _.toArray(model.get('child_items'));
					for (var i=1;i<=Math.min(this.showThumbnailCount, kids.length);i++){
						var item = kids[kids.length-i];
						
						var itemView = new Browser.Items.Views.Thumb({model:new Browser.Items.Model(item)});
						itemView.model.set({thumbnail_width:120, thumbnail_height:80});
						itemView.render();
						$('#zeega-my-collections-items-thumbs').append(itemView.el);

					}
		},
		
		getCollectionList : function(){
			var _this = this;
			
			// fetch list of collections for drawer drop-down
			// if user has no collections then make a new 'my collection'
			// but don't save until they add something to it
			
			
			if(sessionStorage.getItem('user')==1){
				this.collection.fetch({
					
					success : function(collection, response)
					{ 
						console.log('SUCCESSFULLY LOADED COLLECTIONS',collection);
						_this.render();
					},
					error : function(collection, response)
					{ 
						console.log(response);
						console.log('Error getting collection list from server');
	
					}
				}
				);
			}
			else{
				console.log(Browser);
				this.collection.add(
					new Browser.Items.Model({
						title:$('#zeega-my-collections-active-collection').text(),
						child_items:[],
					}));
				console.log(this.collection);
				this.render();			
			}
			
			
			
			
		},

	});
})(jda.module("browser"));