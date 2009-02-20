module DragOrder::PageControllerExtensions

  def move_to
    @page = Page.find(params[:id])
    @rel = Page.find(params[:rel])
    @loc = params[:pos].to_i
    
    # Set initial position if the page has none yet
    if @page.position == nil
      @last_page = Page.find_all_by_parent_id( @page.parent.id, :order => [ "position DESC" ], :limit => 1 )
      @last_page.each do |p|
        @page.position = p.position.to_i + 1
      end
    end
    
    # Remove the page from its old position
    @old_siblings = Page.find_all_by_parent_id( @page.parent.id, :conditions => [ "position > " + @page.position.to_s ] )
    @old_siblings.each do |s|
      s.position -= 1
      s.save
    end
    
    @rel.reload
    if @loc != 2
      # Make room for the page
      @new_siblings = Page.find_all_by_parent_id( @rel.parent.id, :conditions => [ "position >= " + (@rel.position + @loc).to_s ] )
      @new_siblings.each do |s|
        if s.id != @page.id
          s.position += 1
          s.save
        end
      end
    end
    
    # Put the page
    @rel.reload
    if @loc != 2
      @page.parent = @rel.parent
      @page.position = @rel.position + (@loc == 1 ? 1 : -1)
    else
      @page.parent = @rel
      @page.position = 1
    end
    @page.save
    
    # Redirect back to the admin pages page
    request.env["HTTP_REFERER"] ? redirect_to(:back) : redirect_to(admin_page_url)
  end
  
end