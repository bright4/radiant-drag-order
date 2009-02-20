module DragOrder::PageExtensions
  def self.included(base)
    base.class_eval {
      self.reflections[:children].options[:order] = "position ASC"
    }
    
    if defined?(Page::NONDRAFT_FIELDS)
      Page::NONDRAFT_FIELDS << 'position'
    end
  end
end
