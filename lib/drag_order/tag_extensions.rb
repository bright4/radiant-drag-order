module DragOrder::TagExtensions
  def self.included(base)
    base.class_eval { alias_method_chain :children_find_options, :drag_order }
  end
  
  def children_find_options_with_drag_order(tag)
    options = children_find_options_without_drag_order(tag)
    options[:order].sub!(/published_at/i, 'position') unless tag.attr['by']
    options
  end
end
