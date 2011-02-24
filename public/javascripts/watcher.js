function longpoll(filename){
  $.ajax({
    url: "poll/" + filename,
    success: function(data){
      $("#log").append(data);
      longpoll(filename);
    }
  });
};
