require 'redcarpet'
require 'lib/template_helpers'

helpers TemplateHelpers

set :markdown,
  :tables => true,
  :autolink => true,
  :gh_blockcode => true,
  :fenced_code_blocks => true,
  :with_toc_data => true
set :markdown_engine, :redcarpet
set :css_dir, 'stylesheets'
set :js_dir, 'javascripts'
set :images_dir, 'images'
set :haml, { ugly: true }

# Blog
activate :blog do |blog|
  blog.name = "blog"
  blog.prefix = "blog"
  blog.permalink = ":title.html"
  blog.tag_template  = "tag_blog.html"
end

page "blog/*", :layout => :article
page "blog", :layout => :layout
page "blog/tags/*", :layout => :layout

# Portfolio
activate :blog do |blog|
  blog.name = "projects"
  blog.prefix = "projects"
  blog.permalink = ":title.html"
  blog.tag_template  = "tag_projects.html"
end

page "projects/*", :layout => :project
page "projects", :layout => :layout
page "projects/tags/*", :layout => :layout
page "/feed.xml", :layout => false

activate :directory_indexes
activate :syntax, :line_numbers => true

# Add bower_components directory to asset pipeline
sprockets.append_path File.join "#{root}", "bower_components"

# Build-specific configuration
configure :build do
  activate :minify_css
  activate :minify_javascript
  activate :asset_hash
  activate :relative_assets

  # Or use a different image path
  # set :http_prefix, "/Content/images/"
end

# Deployment
activate :sync do |sync|
  sync.fog_provider = 'AWS'
  sync.fog_directory = 'mikeball'
  sync.fog_region = 'us-east-1'
  sync.aws_access_key_id = ENV['AWS_ACCESS_KEY_ID']
  sync.aws_secret_access_key = ENV['AWS_SECRET_ACCESS_KEY']
  sync.existing_remote_files = 'delete'
  # sync.gzip_compression = false # Automatically replace files with their equivalent gzip compressed version
  # sync.after_build = false # Disable sync to run after Middleman build ( defaults to true )
end

