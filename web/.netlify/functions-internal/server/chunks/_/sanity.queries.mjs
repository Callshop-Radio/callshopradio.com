const SITEMAP_QUERY = `
*[
  _type in [
    "home", 
    "page", 
    "show", 
    "set", 
    "person", 
    "venue", 
    "article",
    "pool", 
    "timetable", 
    "words", 
    "showsArchive"
  ] && 
  defined(slug.current) && 
  !(_id in path("drafts.**"))
] | order(_updatedAt desc) {
  _type,
  "slug": slug.current,
  "modifiedAt": _updatedAt,
  "loc": select(
    _type == "home" => "/",
    _type == "page" => "/" + slug.current,
    _type == "show" => "/shows/" + slug.current,
    _type == "set" => "/shows/" + show->slug.current + "/" + slug.current,
    _type == "person" => "/pool/" + slug.current,
    _type == "venue" => "/pool/" + slug.current,
    _type == "article" => "/words/" + slug.current,
    _type == "pool" => "/pool",
    _type == "timetable" => "/schedule",
    _type == "showsArchive" => "/shows",
    _type == "words" => "/words",
    "/" + slug.current
  ),
  "changefreq": select(
    _type == "home" => "daily",
    _type == "show" => "weekly",
    _type == "set" => "weekly",
    _type == "person" => "monthly",
    _type == "venue" => "monthly",
    _type == "article" => "weekly",
    _type == "timetable" => "daily",
    _type == "pool" => "weekly",
    _type == "showsArchive" => "daily",
    _type == "words" => "weekly",
    "monthly"
  ),
  "priority": select(
    _type == "home" => 1.0,
    _type == "show" => 0.9,
    _type == "set" => 0.8,
    _type == "person" => 0.7,
    _type == "venue" => 0.7,
    _type == "article" => 0.8,
    _type == "timetable" => 0.9,
    _type == "pool" => 0.8,
    _type == "showsArchive" => 0.9,
    _type == "words" => 0.8,
    0.8
  ),
  // Zus\xE4tzliche Informationen f\xFCr bessere URL-Generierung
  _type == "set" => {
    "show": show->{
      "slug": slug.current
    }
  }
}`;

export { SITEMAP_QUERY as S };
