namespace :radiant do
  namespace :extensions do
    namespace :drag_order do
      
      desc "Runs the migration of the Drag Order extension"
      task :migrate => :environment do
        require 'radiant/extension_migrator'
        if ENV["VERSION"]
          DragOrderExtension.migrator.migrate(ENV["VERSION"].to_i)
        else
          DragOrderExtension.migrator.migrate
        end
      end
      
      desc "Copies public assets of the Drag Order to the instance public/ directory."
      task :update => :environment do
        is_svn_or_dir = proc {|path| path =~ /\.svn/ || File.directory?(path) }
        Dir[DragOrderExtension.root + "/public/**/*"].reject(&is_svn_or_dir).each do |file|
          path = file.sub(DragOrderExtension.root, '')
          directory = File.dirname(path)
          puts "Copying #{path}..."
          mkdir_p RAILS_ROOT + directory
          cp file, RAILS_ROOT + path
        end
      end  
    end
  end
end
