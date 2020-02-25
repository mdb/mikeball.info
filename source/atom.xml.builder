xml.instruct!
xml.feed "xmlns" => "http://www.w3.org/2005/Atom" do
  xml.title config.site_title
  xml.subtitle config.description
  xml.id config.url
  xml.link "href" => config.url
  xml.link "href" => "#{config.url}/feed.xml", "rel" => "self"
  xml.updated blog('blog').articles.first.date.to_time.iso8601
  xml.author { xml.name config.site_title }

  blog('blog').articles[0..20].each do |article|
    xml.entry do
      xml.title article.title
      xml.link "rel" => "alternate", "href" => article.url
      xml.id article.url
      xml.published article.date.to_time.iso8601
      xml.updated article.date.to_time.iso8601
      xml.author { xml.name "Mike Ball" }
      xml.summary article.summary, "type" => "html"
      xml.content article.body, "type" => "html"
    end
  end
end