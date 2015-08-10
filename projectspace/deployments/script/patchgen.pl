use List::Util qw(reduce first);
use Data::Dumper;

sub subHunkFilter {
  @subhunks = $_[0] =~ m/([ \t]*<(\w+)>.*?<\/\2>)/sg;

  @subhunks = @subhunks[map {2*$_} 0..@subhunks/2];

  $direction = $_[1];
  @query = @_[2..$#_];

  for (@subhunks) {
    if (reduce {$a or /$b/} (0,@query)){
      s/^/$direction/mg;
    } elsif ($direction eq "-") {
      s/^/ /mg;
    } else {
      $_ = undef;
    }
  }
  return join "\n", grep {$_} @subhunks;
}

sub makeChangesValidXML {

  sub compare {
    my $a = shift;
    my $b = shift;
    $a =~ s/\s//g;
    $b =~ s/\s//g;
    return $a eq $b;
  }

  my $before  = shift;
  my $change  = shift;
  my $after   = shift;
  my $counter = 0;

  while (compare $before->[-1], $change->[-1] and join("", @$change) !~ /^\s*(?:<(\w+)>.*<\/\1>\s*)*$/s) {
    unshift @$after, pop @$change;
    unshift @$change, pop @$before;

    die if $counter++ == 10;
  }
}

sub processHunkBasic {
  my $hunk = shift;
  $hunk =~ s/\n$//;
  my $nLines = scalar grep {m/^[ +]/} split /\n/, $hunk;
  $hunk =~ s/^@@ \-(\d+),(\d+) \+(\d+),(\d+) @@$/"\n\@\@ \-$1,$2 \+@{[$1+$offset]},$nLines \@\@"/e;
  $offset += ($4-$2);
  return $hunk;
}

sub processHunkAdvanced {
  my $direction  = shift;
  my $hunk       = shift;

  my @queries    = @_;
  my @lines      = grep {$_ =~ m/^[@ $direction]/ } split /\n/, $hunk;
  my $hunkHeader = shift @lines;

  my $i1         = first {$lines[$_] =~ /^[$direction]/ }   0..$#lines;
  my $i2         = first {$_ > $i1 and $lines[$_] =~ /^ / } 0..$#lines;

  my @before     = map {s/^ //mg; $_}            @lines[0  ..$i1-1];
  my @change     = map {s/^[$direction]//mg; $_} @lines[$i1..$i2-1];
  my @after      = map {s/^ //mg; $_}            @lines[$i2..$#lines];

  makeChangesValidXML \@before, \@change, \@after;

  my $before = join ("\n", @before);
  my $change = subHunkFilter join("\n", @change), $direction, @queries;
  my $after  = join ("\n", @after);

  $before =~ s/^/ /mg;
  $after  =~ s/^/ /mg;

  my $nChanges = scalar grep {/^[+-]/} split /\n/, $change;
  $nChanges *= -1 if $direction eq "-";

  if ($nChanges) {
    $hunkHeader =~ s/^@@ \-(\d+),(\d+) \+(\d+),(\d+) @@$/"\n\@\@ \-$1,$2 \+@{[$1+$offset]},@{[$2+$nChanges]} \@\@"/e;
    $offset += $nChanges;

    return join "\n", ($hunkHeader, $before, $change, $after);
  } else {
    return '';
  }
}

#MAIN
{
  my @queries = split /,/, shift;
  my $direction = shift;
  $direction = undef unless $direction =~ /^[+-]$/;
  my $pickaxeRegex = join "|", @queries;
  my @fileDiffs = split /(?=diff --git)/, `git diff -b -U5 -G"$pickaxeRegex" HEAD -- "src/profiles/*.profile" "src/permissionsets/*.permissionset" "src/objects/*.object" "src/layouts/*.layout"`;

  for (@fileDiffs) {
    local $offset = 0;
    m/(diff.*?.(?=\n@@))/s;
    my $fileHeader =  $1;

    s/diff.*?.(?=@@)//s;
    my @hunks = grep {reduce {$a or $_ =~ /$b/} (0,@queries)} split /^(?=@@)/m;

    print $fileHeader;
    if ($direction) {
      print processHunkAdvanced $direction, $_, @queries for @hunks;
    } else {
      print processHunkBasic $_ for @hunks;
    }
    print "\n";
  }
}
