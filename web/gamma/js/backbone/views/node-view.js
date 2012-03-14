var NodeView = Backbone.View.extend({
	
	tagName: 'li',
	
	initialize : function()
	{
		this.model.bind( 'change:thumb_url', this.onNewThumb, this );
	},
	
	render: function()
	{
		var _this = this;
		var template = $("#node-item-template")
			.clone()
			.attr('id','node').addClass('node-thumb-'+this.model.id);
		template
			//.css('background-image','url("'+Zeega.url_prefix+'../'+this.model.get('thumb_url')+'")')
			.find('.node-background')
			.css({
				'background-image':'url("'+this.model.get('thumb_url')+'")',
				'height' : '50px',
				'width' : '50px',
				'position' : 'absolute'
				});
				
		template.find('.node-overlay')
			.click(function(){
				Zeega.loadNode(_this.model);
				return false;
			});

		// node delete function
		template.find('.delete-node')
			.css('z-index',100)
			.click(function(){
				//if the current node is being deleted, load another node
				//if the node being deleted is the only node, then just delete all the layers inside the node
				Zeega.destroyNode(_this);
				return false;
			});
		
		//copy the cloned item into the el
		$(this.el).html(template)
			.addClass('node-thumb')
			.attr('id',this.model.id);

		//node droppable stuff
		$(this.el).droppable({
			accept : '.database-asset',
			hoverClass : 'node-item-hover',
			tolerance : 'pointer',

			//this happens when you drop a database item onto a node
			drop : function( event, ui )
			{
				
				//_this.model.noteChange();
				console.log(Zeega.draggedItem);
				
				ui.draggable.draggable('option','revert',false);
				//make the new layer model
				
				var settings = {
					url: Zeega.url_prefix + 'nodes/'+ _this.model.id +'/layers',
					type: Zeega.draggedItem.get('source'),
//					zIndex: Zeega.currentNode.get('layers').length+1,
					attr: {
						'item_id' : Zeega.draggedItem.id,
						'title' : Zeega.draggedItem.get('title'),
						'url' : Zeega.draggedItem.get('uri'),
					}
				};
				var newLayer = new Layer( settings );
				
				Zeega.addLayerToNode(_this.model,newLayer, this);
				
			}
		});

		
		//enable the hover when dragging DB items	
		$(this.el).hover(
			//mouseover
			function()
			{
				//only highlight the node if something is being dragged into it
				if( Zeega.draggedItem == null ) $(this).find('.delete-node').show();
			},
			//mouseout
			function()
			{
				$(this).find('.delete-node').hide();
			}
		);
			
		return this;
	},
	
	onNewThumb : function()
	{
		var _this = this;
		//Update thumbnail in route display
		if( $(this.el).is(':visible '))
		{
			$(this.el).find('.node-background').fadeOut('fast',function(){
				$(_this.el)
					.css('background-image','url("'+ _this.model.get('thumb_url') +'")')
					.fadeIn('fast');
				$(_this.el).find('.node-update-overlay')
					.fadeOut('slow');
			});
		}else{
			$(this.el).find('.node-background')
				.css('background-image','url("'+ this.model.get('thumb_url') +'")');
			$(this.el).find('.node-update-overlay')
				.hide();
		}
	}
	
});


var NodeViewCollection = Backbone.View.extend({
	//set the location where the nodes are to be drawn
	el : $('#node-drawer ul'),
	
	initialize : function()
	{
		
		//	bind add & remove actions
		_(this).bindAll('add','remove');
		
		//create empty _nodeViews array
		this._nodeViews = [];
		
		//	add each node to the view
		this.collection.each(this.add);
		
		//	bind the view to the add & remove events of the collection
		this.collection.bind('add', this.add);
		this.collection.bind('remove', this.remove);
		
	},
	
	add : function(node)
	{
		var z = this;
		node.url = Zeega.url_prefix+'nodes/'+ node.id;
		
		//save node if the layer is new!
		if( node.isNew() )
		{
			_(Zeega.route.nodes).push(node);
			node.url = Zeega.url_prefix+'routes/'+ Zeega.routeID +'/nodes';
			if(Zeega.currentNode) node.set({'attr':{'editorHidden':Zeega.currentNode.get('attr').editorHidden}});
			node.save(
				{thumb_url:''},
				{
					success : function()
					{

						
						node.url = Zeega.url_prefix+'nodes/'+ node.id;
						//must do this after success to capture the new id!!
						z.pushView(new NodeView({ model : node }));
						
						//add persisting layers to new nodes
						var persistLayers = Zeega.route.get('attr').persistLayers;
						_.each(persistLayers,function(layerID){
							Zeega.addLayerToNode( node, Zeega.route.layers.get(layerID) );
						});
						//add a new current node style
						$('.node-thumb-'+Zeega.currentNode.id).addClass('node-selected');
						
						//go to the new node
						Zeega.loadNode(node);
					}
				}
				
				);
		}else{
			this.pushView(new NodeView({ model : node }));
		}
		
	},
	
	pushView : function( nv )
	{
		//	push the nodeView to the collection
		//should be placed after the current node
		this._nodeViews.push(nv);
		//	if already rendered
		//	append to the rendered view
		if (this._rendered) 
		{
			$(this.el).append(nv.render().el);
			//$(nv.render().el).find('.node-overlay').effect("highlight", {}, 3000);
			
			//call re-sort
			Zeega.nodeSort()
		}
	},
	
	render : function()
	{
		this._rendered = true;
		var _this = this;
		
		//clear out any old stuff inside this.el
		$(this.el).empty();
		//add EACH model's view to the _this.el and render it
		_(this._nodeViews).each(function(node){
			$(_this.el).append(node.render().el);
		});
		
		console.log('renderNodes');

		return this;
	}
	
});